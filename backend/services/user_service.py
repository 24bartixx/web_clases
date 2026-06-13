from datetime import datetime, timedelta, timezone
import secrets
from urllib.parse import urlencode

from fastapi import HTTPException, status
import httpx
import jwt
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from core.config import settings
from models.position import Position
from models.simulation import Simulation
from models.simulation_history import SimulationHistory
from models.summary import Summary
from models.transaction import Transaction
from models.user import User
from repositories import user_repository
from schemas.user_schema import UserCreate, UserRead, UserUpdate

from services.oauth import get_provider

TOKEN_LIFETIME_MINUTES = 60

def get_users(db: Session, skip: int = 0, limit: int = 100):
    statement = select(User).order_by(User.user_id).offset(skip).limit(limit)
    return db.scalars(statement).all()


def get_user(db: Session, user_id: int):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def get_user_by_oauth_id(db: Session, oauth_id: str):
    statement = select(User).where(User.oauth_id == oauth_id)
    user = db.scalars(statement).one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def create_user(db: Session, user_data: UserCreate):
    user = User(
        email=user_data.email,
        oauth_id=user_data.oauth_id,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        picture=user_data.picture,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not create user.")
    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, user_data: UserUpdate):
    user = get_user(db, user_id)
    if hasattr(user_data, "email") and user_data.email is not None:
        user.email = user_data.email
    if hasattr(user_data, "oauth_id") and user_data.oauth_id is not None:
        user.oauth_id = user_data.oauth_id
    if user_data.first_name is not None:
        user.first_name = user_data.first_name
    if user_data.last_name is not None:
        user.last_name = user_data.last_name
    if user_data.picture is not None:
        user.picture = user_data.picture
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not update user.") from exc
    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int):
    user = get_user(db, user_id)
    _delete_user_related_records(db, user_id)
    db.delete(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not delete user.") from exc


def delete_users(db: Session):
    try:
        _delete_user_related_records(db)
        deleted_count = user_repository.delete_users(db)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not delete users.") from exc
    return {"deleted_count": deleted_count}


def _delete_user_related_records(db: Session, user_id: int | None = None):
    simulation_ids = select(Simulation.simulation_id)
    if user_id is not None:
        simulation_ids = simulation_ids.where(Simulation.user_id == user_id)
    for model in (SimulationHistory, Summary, Transaction, Position):
        db.execute(delete(model).where(model.simulation_id.in_(simulation_ids)))
    simulation_delete = delete(Simulation)
    if user_id is not None:
        simulation_delete = simulation_delete.where(Simulation.user_id == user_id)
    db.execute(simulation_delete)

def constuct_token(user_id: int) -> str:
    payload_jwt = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=TOKEN_LIFETIME_MINUTES)
    }
    return jwt.encode(payload_jwt, settings.secret_key, algorithm="HS256")


def get_oauth_authorization_url(provider: str) -> tuple[str, str]:
    oauth_provider = get_provider(provider)
    
    state = secrets.token_urlsafe(32)
    
    params = oauth_provider.get_auth_params(state=state)
    auth_url = f"{oauth_provider.auth_url}?{urlencode(params)}"
    
    return auth_url, state


async def login_oauth_user(
    db: Session, 
    provider: str, 
    code: str, 
    state_from_url: str | None, 
    state_from_cookie: str | None
) -> UserRead:

    if state_from_url and state_from_cookie:
        if not secrets.compare_digest(state_from_url, state_from_cookie):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="State parameter mismatch. Possible CSRF attack."
            )

    oauth_provider = get_provider(provider)
    payload = oauth_provider.build_token_payload(code)

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            token_response = await client.post(
                oauth_provider.token_url, 
                data=payload, 
                headers={"Accept": "application/json"}
            )
            token_response.raise_for_status()
            token_data = token_response.json()
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
                detail="Token endpoint connection error."
            ) from exc

        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Invalid OAuth code or application setup."
            )

        try:
            profile = await oauth_provider.fetch_profile(access_token, client)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
                detail="Profile validation failed."
            ) from exc

    # Users po tym samym emailu lub oauth_id są traktowani jako ten sam użytkownik
    statement = select(User).where((User.email == profile.email) | (User.oauth_id == profile.oauth_id))
    user = db.scalars(statement).first()

    if user is None:
        user = profile.to_orm()
        db.add(user)
    else:
        profile.update_orm(user)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Database integrity error."
        ) from exc

    db.refresh(user)

    user_read = UserRead.model_validate(user)
    user_read.bearer_token = constuct_token(user.user_id)
    return user_read