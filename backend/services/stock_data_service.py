from datetime import datetime
from decimal import Decimal, InvalidOperation

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from clients.alpha_vantage_client import AlphaVantageClient
from models.enums import StockDataInterval
from repositories import stock_price_repository, stock_repository


class StockImportError(Exception):
    pass


def import_stock_if_missing(
    db: Session,
    client: AlphaVantageClient,
    ticker: str,
):
    ticker = ticker.strip().upper()
    if not ticker:
        return "skipped_empty"

    print(f"Processing {ticker}", flush=True)

    existing_stock = stock_repository.get_stock_by_ticker(db, ticker)
    if existing_stock is not None:
        print(f"Skipping {ticker}: already exists in database", flush=True)
        return "skipped_existing"

    print(f"Fetching overview for {ticker}", flush=True)
    overview = client.get_company_overview(ticker)

    print(f"Fetching daily prices for {ticker}", flush=True)
    prices_response = client.get_daily_prices(ticker)

    print(f"Fetching SMA20 for {ticker}", flush=True)
    sma20_response = client.get_sma(ticker, 20)

    print(f"Fetching SMA50 for {ticker}", flush=True)
    sma50_response = client.get_sma(ticker, 50)

    print(f"Fetching SMA200 for {ticker}", flush=True)
    sma200_response = client.get_sma(ticker, 200)

    print(f"Combining prices and SMA values for {ticker}", flush=True)
    price_rows = _parse_daily_prices(
        prices_response,
        sma20_values=_parse_sma_values(sma20_response, 20),
        sma50_values=_parse_sma_values(sma50_response, 50),
        sma200_values=_parse_sma_values(sma200_response, 200),
    )
    if not price_rows:
        raise StockImportError(f"No daily prices returned for {ticker}")

    try:
        print(f"Saving {ticker} with {len(price_rows)} price rows", flush=True)
        stock = stock_repository.create_stock(
            db,
            ticker=ticker,
            company_name=_clean_api_value(overview.get("Name")),
            description=_clean_api_value(overview.get("Description")),
            sector=_clean_api_value(overview.get("Sector")),
            industry=_clean_api_value(overview.get("Industry")),
            country=_clean_api_value(overview.get("Country")),
            currency=_clean_api_value(overview.get("Currency")),
            website=_clean_api_value(overview.get("OfficialSite")),
        )
        stock_price_repository.create_stock_prices(db, stock.stock_id, price_rows)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        print(f"Failed saving {ticker}: database integrity error", flush=True)
        raise StockImportError(f"Could not save {ticker}: {exc}") from exc
    except Exception:
        db.rollback()
        print(f"Failed saving {ticker}", flush=True)
        raise

    print(f"Finished {ticker}", flush=True)
    return f"imported_{len(price_rows)}_prices"


def _parse_daily_prices(
    data: dict,
    sma20_values: dict[str, Decimal],
    sma50_values: dict[str, Decimal],
    sma200_values: dict[str, Decimal],
):
    time_series = data.get("Time Series (Daily)")
    if not isinstance(time_series, dict):
        return []

    prices = []

    for raw_date in sorted(time_series.keys()):
        values = time_series[raw_date]
        try:
            close = _decimal(values["4. close"])
            prices.append(
                {
                    "interval": StockDataInterval.daily,
                    "open": _decimal(values["1. open"]),
                    "high": _decimal(values["2. high"]),
                    "low": _decimal(values["3. low"]),
                    "close": close,
                    "volume": _decimal(values["5. volume"]),
                    "dividend_amount": None,
                    "sma20": sma20_values.get(raw_date, Decimal("0")),
                    "sma50": sma50_values.get(raw_date, Decimal("0")),
                    "sma200": sma200_values.get(raw_date, Decimal("0")),
                    "price_date": datetime.fromisoformat(raw_date),
                }
            )
        except (KeyError, ValueError, InvalidOperation) as exc:
            raise StockImportError(f"Could not parse price row for {raw_date}") from exc

    return prices


def _parse_sma_values(data: dict, period: int):
    sma_series = data.get("Technical Analysis: SMA")
    if not isinstance(sma_series, dict):
        raise StockImportError(f"No SMA{period} values returned")

    values = {}
    for raw_date, row in sma_series.items():
        try:
            values[raw_date] = _decimal(row["SMA"])
        except (KeyError, InvalidOperation) as exc:
            raise StockImportError(f"Could not parse SMA{period} row for {raw_date}") from exc

    return values


def _decimal(value: str | None, default: Decimal | None = Decimal("0")):
    if value in (None, "", "None"):
        return default
    return Decimal(value)


def _clean_api_value(value: str | None):
    if value in (None, "", "None", "N/A", "-"):
        return None
    return value
