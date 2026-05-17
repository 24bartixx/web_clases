import csv
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from clients.alpha_vantage_client import (  # noqa: E402
    AlphaVantageClient,
    AlphaVantageRateLimitError,
)
from core.config import settings  # noqa: E402
from db.database import SessionLocal  # noqa: E402
from services import stock_data_service  # noqa: E402

TICKERS_PATH = PROJECT_ROOT / "data" / "reference" / "sp500_tickers.csv"


def main():
    tickers = load_tickers(TICKERS_PATH)
    client = AlphaVantageClient(settings.alpha_vantage_api_key)

    imported = 0
    skipped = 0
    failed = 0

    with SessionLocal() as db:
        for index, ticker in enumerate(tickers, start=1):
            try:
                result = stock_data_service.import_stock_if_missing(db, client, ticker)
            except AlphaVantageRateLimitError as exc:
                print(f"[{index}/{len(tickers)}] {ticker}: rate limit reached", flush=True)
                print(exc, flush=True)
                break
            except Exception as exc:
                failed += 1
                print(f"[{index}/{len(tickers)}] {ticker}: failed - {exc}", flush=True)
                continue

            if result == "skipped_existing":
                skipped += 1
            elif result.startswith("imported_"):
                imported += 1

            print(f"[{index}/{len(tickers)}] {ticker}: {result}", flush=True)

    print(
        f"Finished. imported={imported}, skipped_existing={skipped}, failed={failed}",
        flush=True,
    )


def load_tickers(path: Path):
    with path.open(newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        return [
            row["ticker"].strip().upper()
            for row in reader
            if row.get("ticker") and row["ticker"].strip()
        ]


if __name__ == "__main__":
    main()
