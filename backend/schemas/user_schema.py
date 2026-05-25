from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

class UserBase(BaseModel):
    google_id: str
    name : str
    surname : str | None = None
    email : str
    picture : str | None = None

class UserUpdate(BaseModel):
    user_id: int
    name : str | None = None
    surname : str | None = None
    email : str | None = None
    picture : str | None = None