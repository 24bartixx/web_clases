from sqlalchemy import select
from sqlalchemy.orm import Session

from models.stock import Stock


def get_stocks(db: Session, skip: int = 0, limit: int = 100):
    statement = select(Stock).order_by(Stock.ticker).offset(skip).limit(limit)
    return db.scalars(statement).all()


def get_stock_by_ticker(db: Session, ticker: str):
    statement = select(Stock).where(Stock.ticker == ticker.upper())
    return db.scalars(statement).one_or_none()


def create_stock(
    db: Session,
    *,
    ticker: str,
    company_name: str | None = None,
    description: str | None = None,
    sector: str | None = None,
    industry: str | None = None,
    country: str | None = None,
    currency: str | None = None,
    website: str | None = None,
):
    stock = Stock(
        ticker=ticker.upper(),
        company_name=company_name,
        description=description,
        sector=sector,
        industry=industry,
        country=country,
        currency=currency,
        website=website,
    )
    db.add(stock)
    db.flush()
    return stock
