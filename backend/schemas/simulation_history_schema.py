from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

class SimulationHistoryCreate(BaseModel):
    simulation_id: int
    balance: Decimal
    timestamp: datetime

class SimulationHistoryUpdate(BaseModel):
    simulation_history_id: int
    balance: Decimal
    timestamp: datetime