from datetime import datetime
import secrets

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.enums import TransactionType
from models.position import Position
from models.simulation import Simulation
from models.simulation_history import SimulationHistory
from models.transaction import Transaction
from repositories import transaction_repository
from schemas.transaction_schema import TransactionCreate


def get_transactions(db: Session, skip: int = 0, limit: int = 100, user_id: int | None = None):
    statement = select(Transaction).join(Simulation)
    if user_id is not None:
        statement = statement.where(Simulation.user_id == user_id)
    statement = statement.order_by(Transaction.transaction_id).offset(skip).limit(limit)
    return db.scalars(statement).all()


def get_transactions_by_simulation(db: Session, simulation_id: int, user_id: int):
    _check_simulation_ownership(db, simulation_id, user_id)
    return transaction_repository.get_transactions_by_simulation_id(db, simulation_id)


def get_transactions_by_stock_simulation(db: Session, stock_id: int, simulation_id: int, user_id: int):
    _check_simulation_ownership(db, simulation_id, user_id)
    return transaction_repository.get_transactions_by_stock_simulation_id(
        db,
        stock_id,
        simulation_id,
    )


def get_transactions_by_type_simulation(
    db: Session,
    transaction_type: TransactionType,
    simulation_id: int,
    user_id: int,
):
    _check_simulation_ownership(db, simulation_id, user_id)
    return transaction_repository.get_transactions_by_type_simulation_id(
        db,
        transaction_type,
        simulation_id,
    )


def get_transactions_by_stock_date_range(
    db: Session,
    stock_id: int,
    start_date: datetime,
    end_date: datetime,
    user_id: int,
):
    statement = select(Transaction).join(Simulation).where(
        Transaction.stock_id == stock_id,
        Transaction.transaction_time >= start_date,
        Transaction.transaction_time <= end_date,
        Simulation.user_id == user_id
    )
    return db.scalars(statement).all()


def get_transaction(db: Session, transaction_id: int, user_id: int):
    statement = select(Transaction).join(Simulation).where(
        Transaction.transaction_id == transaction_id,
        Simulation.user_id == user_id
    )
    transaction = db.scalars(statement).one_or_none()
    if transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return transaction


def create_transaction(db: Session, transaction_data: TransactionCreate, user_id: int):
    statement = select(Simulation).where(
        Simulation.simulation_id == transaction_data.simulation_id,
        Simulation.user_id == user_id
    )
    simulation = db.scalars(statement).one_or_none()
    if simulation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found",
        )

    transaction = Transaction(**transaction_data.model_dump())
    transaction_value = transaction_data.price * transaction_data.amount
    latest_history = _get_latest_simulation_history(db, transaction_data.simulation_id, user_id)

    if latest_history is None:
        latest_history = SimulationHistory(
            simulation_id=transaction_data.simulation_id,
            balance=simulation.initial_balance,
            profit_loss=0,
            available_funds=simulation.initial_balance,
            timestamp=simulation.current_date,
        )
        db.add(latest_history)

    position = _get_position_by_stock_simulation(
        db,
        stock_id=transaction_data.stock_id,
        simulation_id=transaction_data.simulation_id,
        user_id=user_id,
    )

    if position is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Position not found for transaction stock and simulation.",
        )

    if transaction_data.transaction_type == TransactionType.buy:
        latest_history.available_funds -= transaction_value
        position.amount += transaction_data.amount
    else:
        if position.amount < transaction_data.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot sell more stock than currently held.",
            )

        latest_history.available_funds += transaction_value
        position.amount -= transaction_data.amount

    simulation.updated_at = datetime.now()
    db.add(transaction)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create transaction. Check related simulation_id and stock_id.",
        ) from exc

    db.refresh(transaction)
    return transaction


def _get_position_by_stock_simulation(
    db: Session,
    stock_id: int,
    simulation_id: int,
    user_id: int,
):
    statement = select(Position).join(Simulation).where(
        Position.stock_id == stock_id,
        Position.simulation_id == simulation_id,
        Simulation.user_id == user_id,
    )
    return db.scalars(statement).one_or_none()


def _get_latest_simulation_history(db: Session, simulation_id: int, user_id: int):
    statement = (
        select(SimulationHistory).join(Simulation).where(
            SimulationHistory.simulation_id == simulation_id,
            Simulation.user_id == user_id
        )
        .order_by(SimulationHistory.timestamp.desc(), SimulationHistory.history_id.desc())
    )
    return db.scalars(statement).first()


def delete_transaction(db: Session, transaction_id: int, user_id: int):
    transaction = get_transaction(db, transaction_id, user_id)
    db.delete(transaction)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete transaction because related records exist.",
        ) from exc


def delete_transactions(db: Session, user_id: int):
    try:
        sim_subquery = select(Simulation.simulation_id).where(Simulation.user_id == user_id)
        statement = delete(Transaction).where(Transaction.simulation_id.in_(sim_subquery))
        result = db.execute(statement)
        deleted_count = result.rowcount
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete transactions because related records exist.",
        ) from exc

    return {"deleted_count": deleted_count or 0}


def _check_simulation_ownership(db: Session, simulation_id: int, user_id: int):
    statement = select(Simulation).where(Simulation.simulation_id == simulation_id, Simulation.user_id == user_id)
    if db.scalars(statement).one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Simulation not found")
