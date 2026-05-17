from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Stock(Base):
    __tablename__ = "stocks"

    stock_id: Mapped[int] = mapped_column(primary_key=True)
    ticker: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255))
    sector_id: Mapped[int] = mapped_column(
        ForeignKey("sectors.sector_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )

    sector = relationship("Sector", back_populates="stocks")
    prices = relationship("StockPrice", back_populates="stock")
    positions = relationship("Position", back_populates="stock")
    transactions = relationship("Transaction", back_populates="stock")
    summaries = relationship("Summary", back_populates="stock")
