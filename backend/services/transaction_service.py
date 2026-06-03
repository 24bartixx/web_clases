from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.enums import TransactionType
from models.simulation import Simulation
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

    if transaction_data.transaction_type == TransactionType.buy:
        simulation.current_balance -= transaction_value
    else:
        simulation.current_balance += transaction_value

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
