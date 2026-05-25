from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from models.enums import RoundType

class UserBase(BaseModel):
    id: int
    google_id: str
    name : str
    surname : str | None = None
    email : str
    picture : str | None = None