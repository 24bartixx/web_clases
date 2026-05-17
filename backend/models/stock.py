from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Stock(Base):
    __tablename__ = "stocks"

    stock_id: Mapped[int] = mapped_column(primary_key=True)
    ticker: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text)
    sector: Mapped[str | None] = mapped_column(String(120))
    industry: Mapped[str | None] = mapped_column(String(120))
    country: Mapped[str | None] = mapped_column(String(80))
    currency: Mapped[str | None] = mapped_column(String(10))
    website: Mapped[str | None] = mapped_column(String(512))

    prices = relationship("StockPrice", back_populates="stock")
    positions = relationship("Position", back_populates="stock")
    transactions = relationship("Transaction", back_populates="stock")
    summaries = relationship("Summary", back_populates="stock")
