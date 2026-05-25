from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from models.enums import RoundType

class SimulationHistoryBase(BaseModel):
    history_id: int
    simulation_id: int
    balance: Decimal
    simulation_timestamp: datetime
    created_at: datetime