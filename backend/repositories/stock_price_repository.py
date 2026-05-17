from models.stock_price import StockPrice


def create_stock_prices(db, stock_id: int, prices: list[dict]):
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
            sma20=price["sma20"],
            sma50=price["sma50"],
            sma200=price["sma200"],
            price_date=price["price_date"],
        )
        for price in prices
    ]

    db.add_all(stock_prices)
    return stock_prices
