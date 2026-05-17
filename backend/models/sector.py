from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class Sector(Base):
    __tablename__ = "sectors"

    sector_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str | None] = mapped_column(String(60))

    stocks = relationship("Stock", back_populates="sector")
