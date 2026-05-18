from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Mapping

from models.enums import StockDataInterval
from models.stock_price import StockPrice


def create_stock_prices(db, stock_id: int, prices):
    parsed_prices = _parse_prices(prices)
    stock_prices = [
        StockPrice(
            stock_id=stock_id,
            interval=price["interval"],
            open=price["open"],
            high=price["high"],
            low=price["low"],
            close=price["close"],
            volume=price["volume"],
            dividend_amount=price.get("dividend_amount"),
            price_date=price["price_date"],
        )
        for price in parsed_prices
    ]

    db.add_all(stock_prices)
    return stock_prices


def _parse_prices(prices):
    if hasattr(prices, "iterrows"):
        return [
            parsed_price
            for price_date, row in prices.iterrows()
            if (parsed_price := _parse_yfinance_history_row(price_date, row)) is not None
        ]

    return [_parse_price_mapping(price) for price in prices]


def _parse_yfinance_history_row(price_date, row):
    open_price = _to_decimal(row.get("Open"))
    high = _to_decimal(row.get("High"))
    low = _to_decimal(row.get("Low"))
    close = _to_decimal(row.get("Close"))
    volume = _to_decimal(row.get("Volume"))
    parsed_date = _to_datetime(price_date)

    if None in (open_price, high, low, close, volume, parsed_date):
        return None

    return {
        "interval": StockDataInterval.daily,
        "open": open_price,
        "high": high,
        "low": low,
        "close": close,
        "volume": volume,
        "dividend_amount": _to_decimal(row.get("Dividends")),
        "price_date": parsed_date,
    }


def _parse_price_mapping(price: Mapping):
    parsed_price = dict(price)
    parsed_price["open"] = _to_decimal(parsed_price["open"])
    parsed_price["high"] = _to_decimal(parsed_price["high"])
    parsed_price["low"] = _to_decimal(parsed_price["low"])
    parsed_price["close"] = _to_decimal(parsed_price["close"])
    parsed_price["volume"] = _to_decimal(parsed_price["volume"])
    parsed_price["dividend_amount"] = _to_decimal(parsed_price.get("dividend_amount"))
    parsed_price["price_date"] = _to_datetime(parsed_price["price_date"])
    return parsed_price


def _to_decimal(value):
    if _is_empty(value):
        return None

    if isinstance(value, Decimal):
        return value

    try:
        decimal_value = Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None

    if not decimal_value.is_finite():
        return None

    return decimal_value


def _to_datetime(value):
    if _is_empty(value):
        return None

    if hasattr(value, "to_pydatetime"):
        value = value.to_pydatetime()

    if isinstance(value, datetime):
        return value.replace(tzinfo=None)

    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time())

    return None


def _is_empty(value):
    if value is None:
        return True

    try:
        return bool(value != value)
    except TypeError:
        return False
