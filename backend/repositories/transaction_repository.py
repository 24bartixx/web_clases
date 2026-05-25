from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from models.enums import TransactionType
from models.transaction import Transaction
from schemas.transaction_schema import TransactionCreate

def get_transaction_by_id(db: Session, transaction_id: int):
    return db.get(Transaction, transaction_id)

def get_transactions_by_simulation_id(db: Session, simulation_id: int):
    statement = select(Transaction).where(Transaction.simulation_id == simulation_id).order_by(Transaction.transaction_id)
    return db.scalars(statement).all()

def get_transactions_by_stock_simulation_id(db: Session, stock_id: int, simulation_id: int):
    statement = select(Transaction).where(Transaction.stock_id == stock_id, Transaction.simulation_id == simulation_id).order_by(Transaction.transaction_id)
    return db.scalars(statement).all()

def get_transactions_by_type_simulation_id(db: Session, transaction_type: TransactionType, simulation_id: int):
    statement = select(Transaction).where(Transaction.transaction_type == transaction_type, Transaction.simulation_id == simulation_id).order_by(Transaction.transaction_id)
    return db.scalars(statement).all()

def get_transactions_by_stock_date_range(db: Session, stock_id: int, start_date: datetime, end_date: datetime):
    statement = select(Transaction).where(
        Transaction.stock_id == stock_id,
        Transaction.transaction_time >= start_date,
        Transaction.transaction_time <= end_date
    ).order_by(Transaction.transaction_id)
    return db.scalars(statement).all()

def create_transaction(db: Session, transaction: TransactionCreate):
    transaction = Transaction(**transaction.dict())
    db.add(transaction)
    db.flush()
    return transaction

def delete_transaction(db: Session, transaction_id: int):
    transaction = db.get(Transaction, transaction_id)
    if transaction:
        db.delete(transaction)
        return True
    return False

def delete_transactions(db: Session):
    result = db.execute(delete(Transaction))
    return result.rowcount or 0
