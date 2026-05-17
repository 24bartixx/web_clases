def get_stocks():
    return {
        "stocks": [
            {"symbol": "AAPL", "name": "Apple Inc."},
            {"symbol": "MSFT", "name": "Microsoft Corporation"},
            {"symbol": "TSLA", "name": "Tesla Inc."},
        ]
    }


def get_stock(symbol: str):
    return {
        "symbol": symbol.upper(),
        "name": "Example Stock",
        "price": 123.45,
        "currency": "USD",
    }
