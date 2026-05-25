from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

class PostitionCreate(BaseModel):
    simulation_id: int
    stock_id: int
    amount: Decimal

class PositionUpdate(BaseModel):
    position_id: int
    amount: Decimal