from datetime import date, timedelta
from io import StringIO

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
import yfinance as yf
import pandas as pd
import requests

from repositories import stock_repository


SP500_WIKI_URL = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
MARKET_CALENDAR_TICKER = "SPY"
YFINANCE_INTERVALS = {
    "1m",
    "2m",
    "5m",
    "15m",
    "30m",
    "60m",
    "90m",
    "1h",
    "1d",
    "5d",
    "1wk",
    "1mo",
    "3mo",
}


def get_next_trading_date(current_date: date, days: int = 1):
    days = max(1, days)
    include_start = not is_trading_date(current_date)
    return _get_nth_trading_date(current_date, days, include_start=include_start)


def get_trading_date_on_or_after(current_date: date):
    return _get_nth_trading_date(current_date, 1, include_start=True)


def get_trading_date_on_or_before(current_date: date):
    lookback_start = current_date - timedelta(days=14)

    for _ in range(10):
        trading_dates = _get_market_trading_dates(
            lookback_start,
            current_date + timedelta(days=1),
        )
        valid_dates = [trading_date for trading_date in trading_dates if trading_date <= current_date]

        if valid_dates:
            return valid_dates[-1]

        lookback_start -= timedelta(days=30)

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"No trading date found on or before {current_date}.",
    )


def get_trading_dates(start: date, finish: date):
    if finish < start:
        return []

    return _get_market_trading_dates(start, finish + timedelta(days=1))


def is_trading_date(current_date: date):
    return current_date in _get_market_trading_dates(
        current_date,
        current_date + timedelta(days=1),
    )


def _get_nth_trading_date(
    start_date: date,
    days: int,
    include_start: bool,
):
    search_start = start_date
    remaining_days = days

    for _ in range(10):
        search_finish = search_start + timedelta(days=max(14, remaining_days * 4 + 7))
        trading_dates = _get_market_trading_dates(search_start, search_finish)

        if not include_start:
            trading_dates = [
                trading_date for trading_date in trading_dates if trading_date > start_date
            ]

        if len(trading_dates) >= remaining_days:
            return trading_dates[remaining_days - 1]

        remaining_days -= len(trading_dates)
        search_start = search_finish
        include_start = True

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Could not find next trading date from {start_date}.",
    )


def _get_market_trading_dates(start: date, finish: date):
    history = yf.Ticker(MARKET_CALENDAR_TICKER).history(
        start=start.isoformat(),
        end=finish.isoformat(),
        interval="1d",
        timeout=20,
    )

    return sorted({price_date.date() for price_date in history.index})


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


def get_stock_by_id(db: Session, stock_id: int):
    stock = stock_repository.get_stock_by_id(db, stock_id)
    if stock is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stock not found",
        )
    return stock


def delete_stocks(db: Session):
    try:
        deleted_count = stock_repository.delete_stocks(db)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete stocks because related records exist.",
        ) from exc

    return {"deleted_count": deleted_count}


def get_stock_prices(
    db: Session,
    ticker: str,
    start: date | None = None,
    finish: date | None = None,
    interval: str = "1d",
):
    if interval not in YFINANCE_INTERVALS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid interval. Allowed values: {', '.join(sorted(YFINANCE_INTERVALS))}",
        )

    get_stock(db, ticker)

    yfinance_ticker = yf.Ticker(ticker)
    if start is None and finish is None:
        history = yfinance_ticker.history(
            period="max",
            interval=interval,
            timeout=20,
        )
        return _serialize_price_history(history)

    if start is None and finish is not None:
        history = yfinance_ticker.history(
            period="max",
            end=finish.isoformat(),
            interval=interval,
            timeout=20,
        )
        return _serialize_price_history(history)

    finish = finish or date.today()
    if start is not None and finish < start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="finish must be greater than or equal to start",
        )

    history = yfinance_ticker.history(
        start=start.isoformat() if start is not None else None,
        end=finish.isoformat(),
        interval=interval,
        timeout=20,
    )

    return _serialize_price_history(history)


def get_stock_details(db: Session, ticker: str):
    get_stock(db, ticker)
    info = _fetch_stock_data(ticker)

    return {
        "description": _clean_value(info.get("longBusinessSummary")),
        "sharesOutstanding": _clean_int(info.get("sharesOutstanding")),
        "floatShares": _clean_int(info.get("floatShares")),
        "country": _clean_value(info.get("country")),
        "currency": _clean_value(info.get("currency") or info.get("financialCurrency")),
        "website": _clean_value(info.get("website")),
    }


def scrap_stock_data(db: Session, limit: int | None = None):

    tickers = _get_sp500_tickers_from_wiki()
    if limit is not None:
        tickers = tickers[:limit]

    total_tickers = len(tickers)

    for index, ticker in enumerate(tickers, start=1):
        print(f"Scrapping data for {ticker}... ({index}/{total_tickers})", flush=True)

        try:
            info = _fetch_stock_data(ticker)
            print(
                f"Fetched data for {ticker}. Saving... ({index}/{total_tickers})",
                flush=True,
            )

            stock = stock_repository.get_stock_by_ticker(db, ticker)
            if stock is None:
                stock_repository.create_stock(db, info)
            else:
                stock_repository.update_stock(stock, info)

            db.commit()

            print(f"Successfully scrapped data for {ticker}! ({index}/{total_tickers})\n", flush=True)
        except Exception as exc:
            db.rollback()
            print(
                f"Failed to scrap data for {ticker}: {type(exc).__name__} ({index}/{total_tickers})",
                flush=True,
            )


def _get_sp500_tickers_from_wiki():
    response = requests.get(
        SP500_WIKI_URL,
        headers={"User-Agent": "Mozilla/5.0"},
        timeout=20,
    )
    response.raise_for_status()

    parsed_table = pd.read_html(StringIO(response.text), attrs={"id": "constituents"})[0]

    tickers = parsed_table["Symbol"].tolist()
    tickers = [ticker.replace(".", "-") for ticker in tickers]

    print(f"Successfully parsed {len(tickers)} tickers from Wikipedia!\n")

    return tickers


def _fetch_stock_data(ticker: str):
    yfinance_ticker = yf.Ticker(ticker)
    info = dict(yfinance_ticker.info or {})
    info.setdefault("symbol", ticker.upper())

    return info


def _serialize_price_history(history):
    prices = []

    for price_date, row in history.iterrows():
        open_price = _clean_number(row.get("Open"))
        high = _clean_number(row.get("High"))
        low = _clean_number(row.get("Low"))
        close = _clean_number(row.get("Close"))
        volume = _clean_number(row.get("Volume"))

        if None in (open_price, high, low, close, volume):
            continue

        prices.append(
            {
                "price_date": price_date.to_pydatetime(),
                "open": open_price,
                "high": high,
                "low": low,
                "close": close,
                "volume": volume,
                "dividend_amount": _clean_number(row.get("Dividends")),
            }
        )

    return prices


def _clean_number(value):
    if value is None or pd.isna(value):
        return None
    return float(value)


def _clean_int(value):
    if value is None or pd.isna(value):
        return None
    return int(value)


def _clean_value(value):
    if value in (None, "", "N/A"):
        return None
    return value
