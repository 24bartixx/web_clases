from io import StringIO

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import yfinance as yf
import pandas as pd
import requests

from repositories import stock_repository


SP500_WIKI_URL = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"


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
