from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from models.enums import RoundType

class SummaryBase(BaseModel):
    summary_id: int
    simulation_id: int
    stock_id: int
    income: Decimal
    transactions: int
    final_balance: Decimal
    created_at: datetime