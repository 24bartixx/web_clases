from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Simulation(Base):
    __tablename__ = "simulations"

    simulation_id: Mapped[int] = mapped_column(primary_key=True)
    initial_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    current_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    finish_date: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", deferrable=True, initially="IMMEDIATE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    finished_at: Mapped[datetime | None] = mapped_column(DateTime)

    user = relationship("User", back_populates="simulations")
    positions = relationship("Position", back_populates="simulation")
    transactions = relationship("Transaction", back_populates="simulation")
    history = relationship("SimulationHistory", back_populates="simulation")
    summaries = relationship("Summary", back_populates="simulation")

    @property
    def current_balance(self) -> Decimal:
        latest_history = self._latest_history
        if latest_history is None:
            return self.initial_balance

        return latest_history.balance

    @property
    def available_funds(self) -> Decimal:
        latest_history = self._latest_history
        if latest_history is None:
            return self.initial_balance

        return latest_history.available_funds

    @property
    def profit_loss(self) -> Decimal:
        latest_history = self._latest_history
        if latest_history is None:
            return Decimal("0")

        return latest_history.profit_loss

    @property
    def _latest_history(self):
        if not self.history:
            return None

        return max(
            self.history,
            key=lambda entry: (entry.timestamp, entry.history_id),
        )
