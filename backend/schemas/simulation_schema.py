from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from models.enums import RoundType


class SimulationBase(BaseModel):
    initial_balance: Decimal
    start_date: datetime
    finish_date: datetime | None = None
    has_rounds: bool = False
    round_type: RoundType | None = None
    round_value: int | None = None
    user_id: int
    finished_at: datetime | None = None


class SimulationCreate(SimulationBase):
    pass


class SimulationUpdate(BaseModel):
    initial_balance: Decimal | None = None
    current_balance: Decimal | None = None
    start_date: datetime | None = None
    finish_date: datetime | None = None
    has_rounds: bool | None = None
    round_type: RoundType | None = None
    round_value: int | None = None
    user_id: int | None = None
    finished_at: datetime | None = None


class SimulationRead(SimulationBase):
    model_config = ConfigDict(from_attributes=True)

    simulation_id: int
    current_balance: Decimal
    finish_date: datetime
    created_at: datetime
    updated_at: datetime
