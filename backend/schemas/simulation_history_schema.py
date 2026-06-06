from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

class SimulationHistoryCreate(BaseModel):
    simulation_id: int
    balance: Decimal
    profit_loss: Decimal = Decimal("0")
    available_funds: Decimal = Decimal("0")
    timestamp: datetime

class SimulationHistoryUpdate(BaseModel):
    simulation_history_id: int
    balance: Decimal
    profit_loss: Decimal = Decimal("0")
    available_funds: Decimal = Decimal("0")
    timestamp: datetime
