from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Position(Base):
    __tablename__ = "positions"

    position_id: Mapped[int] = mapped_column(primary_key=True)
    simulation_id: Mapped[int] = mapped_column(
        ForeignKey("simulations.simulation_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    stock_id: Mapped[int] = mapped_column(
        ForeignKey("stocks.stock_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, server_default="0"
    )
    current_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    previous_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    price_change: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    price_change_percent: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    volume: Mapped[Decimal | None] = mapped_column(Numeric(20, 2))

    simulation = relationship("Simulation", back_populates="positions")
    stock = relationship("Stock", back_populates="positions")
