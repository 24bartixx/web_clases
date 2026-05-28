from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    google_id: str | None = None
    first_name: str
    last_name: str
    picture: str | None = None


class UserUpdate(BaseModel):
    google_id: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    picture: str | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    google_id: str | None
    first_name: str
    last_name: str
    picture: str | None
    created_at: datetime
