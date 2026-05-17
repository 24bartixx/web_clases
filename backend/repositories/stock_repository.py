from sqlalchemy import select
from sqlalchemy.orm import Session

from models.stock import Stock


def get_stocks(db: Session, skip: int = 0, limit: int = 100):
    statement = select(Stock).order_by(Stock.ticker).offset(skip).limit(limit)
    return db.scalars(statement).all()


def get_stock_by_ticker(db: Session, ticker: str):
    statement = select(Stock).where(Stock.ticker == ticker.upper())
    return db.scalars(statement).one_or_none()
