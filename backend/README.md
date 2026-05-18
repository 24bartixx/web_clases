# Swagger

API docs:

```text
http://localhost:8000/docs
```

# Stock scraping

Start S&P 500 stock data scraping:

```text
POST /api/stocks/scrape
```

The endpoint returns `202 Accepted` immediately and runs the scraping job in the background.

Optional request body:

```json
{
  "limit": 10
}
```

`limit` restricts scraping to the first N tickers from the S&P 500 list. If omitted, all tickers are processed.
