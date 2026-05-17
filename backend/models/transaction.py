from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base
from models.enums import TransactionType


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id: Mapped[int] = mapped_column(primary_key=True)
    transaction_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    transaction_type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, name="transaction_type"), nullable=False
    )
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    stock_id: Mapped[int] = mapped_column(
        ForeignKey("stocks.stock_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    simulation_id: Mapped[int] = mapped_column(
        ForeignKey("simulations.simulation_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    stock = relationship("Stock", back_populates="transactions")
    simulation = relationship("Simulation", back_populates="transactions")
