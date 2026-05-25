from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from models.enums import RoundType

class PostitionBase(BaseModel):
    position_id: int
    simulation_id: int
    stock_id: int
    amount: Decimal