# Swagger

API docs:

```text
http://localhost:8000/docs
```

## Populate S&P 500 Stocks

The stock population job reads tickers from:

```text
backend/data/reference/sp500_tickers.csv
```

For each ticker it:

1. Checks whether the stock already exists in the database.
2. Skips existing stocks, so the job can be safely resumed.
3. Fetches company overview data from Alpha Vantage.
4. Fetches daily historical prices from Alpha Vantage.
5. Fetches SMA 20, SMA 50, and SMA 200 from Alpha Vantage.
6. Saves the stock and its prices in one database transaction.
7. Stops cleanly if Alpha Vantage returns a rate-limit response.

Each missing ticker currently uses 5 Alpha Vantage requests: overview, daily prices,
SMA 20, SMA 50, and SMA 200.

Run it inside Docker:

```bash
docker compose exec backend python jobs/populate_stocks.py
```

Make sure `backend/.env` contains:

```env
ALPHA_VANTAGE_API_KEY=your_api_key_here
```
