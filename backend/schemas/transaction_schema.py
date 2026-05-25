from datetime import datetime
from decimal import Decimal
from enum import Enum
from models.enums import TransactionType

from pydantic import BaseModel, ConfigDict

from models.enums import RoundType

class TransactionBase(BaseModel):
    transaction_id: int
    simulation_id: int
    stock_id: int
    
    transaction_type: TransactionType
    transaction_time: datetime
    
    price: Decimal
    amount: Decimal

    created_at: datetime
