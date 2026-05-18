from datetime import date
from io import StringIO

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import yfinance as yf
import pandas as pd
import requests

from repositories import stock_repository


SP500_WIKI_URL = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
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
