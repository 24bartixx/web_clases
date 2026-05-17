from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from repositories import stock_repository


def get_stocks(db: Session, skip: int = 0, limit: int = 100):
    return stock_repository.get_stocks(db, skip=skip, limit=limit)


def get_stock(db: Session, ticker: str):
    stock = stock_repository.get_stock_by_ticker(db, ticker)
    if stock is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found",
        )
    return stock
