from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class SimulationBase(BaseModel):
    initial_balance: Decimal
    start_date: datetime
    finish_date: datetime | None = None
    user_id: int
    finished_at: datetime | None = None


class SimulationCreate(SimulationBase):
    pass


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
    created_at: datetime
    updated_at: datetime
