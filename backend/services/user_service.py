from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
import jwt
import requests
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

CONFIG = {
    "google": {
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "user_url": "https://www.googleapis.com/oauth2/v3/userinfo",
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": "http://localhost:3000/auth/callback/google",
        "scope": "openid email profile"
    },
    "github": {
        "auth_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "user_url": "https://api.github.com/user",
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "redirect_uri": "http://localhost:3000/auth/callback/github",
        "scope": "read:user user:email"
    }
}

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
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create user. Check email or oauth_id uniqueness.",
        )

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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not update user.",
        ) from exc

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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete user because related records exist.",
        ) from exc


def delete_users(db: Session):
    try:
        _delete_user_related_records(db)
        deleted_count = user_repository.delete_users(db)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete users because related records exist.",
        ) from exc
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


def get_oauth_authorization_url(provider: str) -> str:
    provider_name = provider.lower()
    provider_config = CONFIG.get(provider_name)
    if not provider_config:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Provider {provider} is not supported.")
    
    if provider_name == "google":
        return (
            f"{provider_config['auth_url']}?"
            f"client_id={provider_config['client_id']}&"
            f"redirect_uri={provider_config['redirect_uri']}&"
            f"response_type=code&"
            f"scope={provider_config['scope']}&"
            f"access_type=offline&"
            f"prompt=select_account"
        )
    elif provider_name == "github":
        return (
            f"{provider_config['auth_url']}?"
            f"client_id={provider_config['client_id']}&"
            f"redirect_uri={provider_config['redirect_uri']}&"
            f"scope={provider_config['scope']}"
        )


def login_oauth_user(db: Session, provider: str, code: str) -> UserRead:
    provider_name = provider.lower()
    provider_config = CONFIG.get(provider_name)
    
    if not provider_config:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Provider {provider} is not supported.")

    payload = {
        "client_id": provider_config["client_id"],
        "client_secret": provider_config["client_secret"],
        "code": code,
        "redirect_uri": provider_config["redirect_uri"],
    }
    headers = {"Accept": "application/json"}
    if provider_name == "google":
        payload["grant_type"] = "authorization_code"

    try:
        token_response = requests.post(provider_config["token_url"], data=payload, headers=headers, timeout=10)
        token_data = token_response.json()
    except requests.RequestException as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Could not connect to {provider} token endpoint.") from exc

    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid or expired code from {provider}.")

    try:
        user_response = requests.get(provider_config["user_url"], headers={"Authorization": f"Bearer {access_token}"}, timeout=10)
    except requests.RequestException as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Could not connect to {provider} userinfo endpoint.") from exc

    if user_response.status_code == status.HTTP_401_UNAUTHORIZED:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid {provider} access token.")
    if not user_response.ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not fetch user data from {provider}.")

    profile = user_response.json()

    if provider_name == "google":
        raw_id = profile.get("sub")
        if not raw_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google profile lacks 'sub'.")
        email = profile.get("email")
        first_name = profile.get("given_name") or profile.get("name") or ""
        last_name = profile.get("family_name") or ""
        picture = profile.get("picture")
    else: 
        raw_id = profile.get("id")
        if not raw_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="GitHub profile lacks 'id'.")
        email = profile.get("email")
        
        if not email:
            try:
                email_res = requests.get("https://api.github.com/user/emails", headers={"Authorization": f"Bearer {access_token}"}, timeout=5)
                if email_res.ok:
                    emails_list = email_res.json()
                    primary_email = next((e["email"] for e in emails_list if e.get("primary")), None)
                    email = primary_email or (emails_list[0]["email"] if emails_list else None)
            except Exception:
                pass
        
        if not email:
            email = f"{raw_id}+{profile.get('login')}@users.noreply.github.com"
            
        full_name = profile.get("name") or profile.get("login") or ""
        name_parts = full_name.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        picture = profile.get("avatar_url")

    current_oauth_id = f"{provider_name.upper()}_{raw_id}"

    statement = select(User).where(User.email == email)
    user = db.scalars(statement).one_or_none()

    if user is None:
        statement = select(User).where(User.oauth_id == current_oauth_id)
        user = db.scalars(statement).one_or_none()

    if user is None:
        user = User(
            email=email,
            oauth_id=current_oauth_id,
            first_name=first_name,
            last_name=last_name,
            picture=picture
        )
        db.add(user)
    else:
        user.oauth_id = current_oauth_id

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not save user profile to database.")

    db.refresh(user)

    payload = {
        "sub": str(user.user_id),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60)
    }
    token = jwt.encode(payload, settings.secret_key, algorithm="HS256")

    user_read = UserRead.model_validate(user)
    user_read.bearer_token = token
    return user_read
