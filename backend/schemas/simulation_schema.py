from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from models.enums import TransactionType


class SimulationBase(BaseModel):
    initial_balance: Decimal
    start_date: datetime
    finish_date: datetime | None = None
    user_id: int


class SimulationCreate(BaseModel):
    initial_balance: Decimal
    start_date: datetime
    finish_date: datetime | None = None
    stock_ids: list[int]


class SimulationUpdate(BaseModel):
    initial_balance: Decimal | None = None
    start_date: datetime | None = None
    current_date: datetime | None = None
    finish_date: datetime | None = None
    user_id: int | None = None
    finished_at: datetime | None = None


class SimulationAdvanceTurn(BaseModel):
    days: int = Field(ge=1)


class SimulationRead(SimulationBase):
    model_config = ConfigDict(from_attributes=True)

    simulation_id: int
    current_balance: Decimal
    available_funds: Decimal
    profit_loss: Decimal
    current_date: datetime
    finish_date: datetime
    finished_at: datetime | None
    created_at: datetime
    updated_at: datetime


class SimulationStockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    stock_id: int
    ticker: str
    company_name: str | None
    sector: str | None
    industry: str | None
    description: str | None = None
    sharesOutstanding: int | None = None
    floatShares: int | None = None
    country: str | None = None
    currency: str | None = None
    website: str | None = None


class SimulationPositionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    position_id: int
    stock_id: int
    amount: Decimal
    current_price: Decimal | None = None
    previous_price: Decimal | None = None
    price_change: Decimal | None = None
    price_change_percent: Decimal | None = None
    volume: Decimal | None = None
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
    trading_dates: list[date]
    positions: list[SimulationPositionRead]
    transactions: list[SimulationTransactionRead]
