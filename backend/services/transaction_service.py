from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.enums import TransactionType
from models.position import Position
from models.simulation import Simulation
from models.simulation_history import SimulationHistory
from models.transaction import Transaction
from repositories import transaction_repository
from schemas.transaction_schema import TransactionCreate


def get_transactions(db: Session, skip: int = 0, limit: int = 100):
    statement = select(Transaction).order_by(Transaction.transaction_id).offset(skip).limit(limit)
    return db.scalars(statement).all()


def get_transactions_by_simulation(db: Session, simulation_id: int):
    return transaction_repository.get_transactions_by_simulation_id(db, simulation_id)


def get_transactions_by_stock_simulation(db: Session, stock_id: int, simulation_id: int):
    return transaction_repository.get_transactions_by_stock_simulation_id(
        db,
        stock_id,
        simulation_id,
    )


def get_transactions_by_type_simulation(
    db: Session,
    transaction_type: TransactionType,
    simulation_id: int,
):
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
):
    return transaction_repository.get_transactions_by_stock_date_range(
        db,
        stock_id,
        start_date,
        end_date,
    )


def get_transaction(db: Session, transaction_id: int):
    transaction = db.get(Transaction, transaction_id)
    if transaction is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return transaction


def create_transaction(db: Session, transaction_data: TransactionCreate):
    simulation = db.get(Simulation, transaction_data.simulation_id)

    if simulation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation not found",
        )

    transaction = Transaction(**transaction_data.model_dump())
    transaction_value = transaction_data.price * transaction_data.amount
    latest_history = _get_latest_simulation_history(db, transaction_data.simulation_id)

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
):
    statement = select(Position).where(
        Position.stock_id == stock_id,
        Position.simulation_id == simulation_id,
    )
    return db.scalars(statement).one_or_none()


def _get_latest_simulation_history(db: Session, simulation_id: int):
    statement = (
        select(SimulationHistory)
        .where(SimulationHistory.simulation_id == simulation_id)
        .order_by(SimulationHistory.timestamp.desc(), SimulationHistory.history_id.desc())
    )
    return db.scalars(statement).first()


def delete_transaction(db: Session, transaction_id: int):
    transaction = get_transaction(db, transaction_id)
    db.delete(transaction)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete transaction because related records exist.",
        ) from exc


def delete_transactions(db: Session):
    try:
        deleted_count = transaction_repository.delete_transactions(db)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete transactions because related records exist.",
        ) from exc

    return {"deleted_count": deleted_count}
