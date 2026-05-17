from enum import Enum


class RoundType(str, Enum):
    second = "second"
    minute = "minute"
    hour = "hour"
    four_hours = "four_hours"
    day = "day"
    week = "week"
    month = "month"
    year = "year"


class TransactionType(str, Enum):
    buy = "buy"
    sell = "sell"


class StockDataInterval(str, Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
