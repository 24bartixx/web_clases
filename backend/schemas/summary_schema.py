from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

class SummaryCreate(BaseModel):
    simulation_id: int
    stock_id: int
    summary_time: datetime
    income: Decimal
    transactions: int
    final_balance: Decimal