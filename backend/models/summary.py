from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Summary(Base):
    __tablename__ = "summaries"

    summary_id: Mapped[int] = mapped_column(primary_key=True)
    income: Mapped[Decimal] = mapped_column(Numeric(12, 0), nullable=False)
    transactions: Mapped[int] = mapped_column(Integer, nullable=False)
    final_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    stock_id: Mapped[int | None] = mapped_column(
        ForeignKey("stocks.stock_id", deferrable=True, initially="IMMEDIATE")
    )
    simulation_id: Mapped[int] = mapped_column(
        ForeignKey("simulations.simulation_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    stock = relationship("Stock", back_populates="summaries")
    simulation = relationship("Simulation", back_populates="summaries")
