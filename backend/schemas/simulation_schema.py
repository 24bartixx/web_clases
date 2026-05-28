from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from models.enums import TransactionType


class SimulationBase(BaseModel):
    initial_balance: Decimal
    start_date: datetime
    finish_date: datetime | None = None
    user_id: int


class SimulationCreate(SimulationBase):
    stock_ids: list[int]


class SimulationUpdate(BaseModel):
    initial_balance: Decimal | None = None
    current_balance: Decimal | None = None
    start_date: datetime | None = None
    current_date: datetime | None = None
    finish_date: datetime | None = None
    user_id: int | None = None
    finished_at: datetime | None = None


class SimulationRead(SimulationBase):
    model_config = ConfigDict(from_attributes=True)

    simulation_id: int
    current_balance: Decimal
    current_date: datetime
    finish_date: datetime
    finished_at: datetime | None
    created_at: datetime
    updated_at: datetime


class SimulationStockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ticker: str
    company_name: str | None
    sector: str | None
    industry: str | None


class SimulationPositionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    position_id: int
    stock_id: int
    amount: Decimal
    stock: SimulationStockRead


class SimulationTransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    transaction_id: int
    transaction_time: datetime
    transaction_type: TransactionType
    price: Decimal
    amount: Decimal
    stock_id: int
    created_at: datetime
    stock: SimulationStockRead


class SimulationDetailRead(SimulationRead):
    positions: list[SimulationPositionRead]
    transactions: list[SimulationTransactionRead]
