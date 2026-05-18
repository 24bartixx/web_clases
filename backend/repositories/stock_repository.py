from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from models.stock import Stock


def get_stocks(db: Session, skip: int = 0, limit: int = 100):
    statement = select(Stock).order_by(Stock.ticker).offset(skip).limit(limit)
    return db.scalars(statement).all()


def get_stock_by_id(db: Session, stock_id: int):
    return db.get(Stock, stock_id)


def get_stock_by_ticker(db: Session, ticker: str):
    statement = select(Stock).where(Stock.ticker == ticker.upper())
    return db.scalars(statement).one_or_none()


def delete_stocks(db: Session):
    result = db.execute(delete(Stock))
    return result.rowcount or 0


def create_stock(
    db: Session,
    yfinance_info: dict,
):
    ticker = _clean_value(yfinance_info.get("symbol"))
    if ticker is None:
        raise ValueError("Cannot create stock without ticker symbol")

    stock = Stock(ticker=ticker.upper(), **_stock_fields_from_yfinance_info(yfinance_info))
    db.add(stock)
    db.flush()
    return stock


def update_stock(
    stock: Stock,
    yfinance_info: dict,
):
    for field, value in _stock_fields_from_yfinance_info(yfinance_info).items():
        setattr(stock, field, value)

    return stock


def _stock_fields_from_yfinance_info(yfinance_info: dict):
    return {
        "company_name": _truncate(
            _clean_value(
                yfinance_info.get("longName")
                or yfinance_info.get("shortName")
                or yfinance_info.get("displayName")
            ),
            255,
        ),
        "sector": _truncate(_clean_value(yfinance_info.get("sector")), 120),
        "industry": _truncate(_clean_value(yfinance_info.get("industry")), 120),
    }


def _clean_value(value):
    if value in (None, "", "N/A"):
        return None
    return value


def _truncate(value: str | None, max_length: int):
    if value is None:
        return None
    return value[:max_length]
