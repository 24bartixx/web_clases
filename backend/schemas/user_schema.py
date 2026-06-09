from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    email: str                         
    oauth_id: str | None = None
    first_name: str
    last_name: str
    picture: str | None = None


class UserUpdate(BaseModel):
    email: str | None = None
    oauth_id: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    picture: str | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    email: str
    oauth_id: str | None
    first_name: str
    last_name: str
    picture: str | None
    created_at: datetime | None = None
    bearer_token: str | None = None


class UserLoginData(BaseModel):
    code: str
    state: str | None = None