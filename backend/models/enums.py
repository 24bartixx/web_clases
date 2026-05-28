from enum import Enum


class TransactionType(str, Enum):
    buy = "buy"
    sell = "sell"
