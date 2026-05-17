from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base
from models.enums import StockDataInterval


class StockPrice(Base):
    __tablename__ = "stock_prices"

    stock_prices_id: Mapped[int] = mapped_column(primary_key=True)
    interval: Mapped[StockDataInterval] = mapped_column(
        Enum(StockDataInterval, name="stock_data_interval"), nullable=False
    )
    open: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    high: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    low: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    close: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    volume: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    dividend_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    sma20: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    sma50: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    sma200: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    price_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    stock_id: Mapped[int] = mapped_column(
        ForeignKey("stocks.stock_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )

    stock = relationship("Stock", back_populates="prices")
