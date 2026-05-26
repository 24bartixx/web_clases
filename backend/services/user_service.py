from fastapi import HTTPException, status
import requests
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.user import User
from repositories import user_repository
from schemas.user_schema import UserBase, UserUpdate

GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def get_users(db: Session, skip: int = 0, limit: int = 100):
    statement = select(User).order_by(User.user_id).offset(skip).limit(limit)
    return db.scalars(statement).all()


def get_user(db: Session, user_id: int):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def get_user_by_google_id(db: Session, google_id: str):
    statement = select(User).where(User.google_id == google_id)
    user = db.scalars(statement).one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def create_user(db: Session, user_data: UserBase):
    user = User(
        google_id=user_data.google_id,
        email=user_data.email,
        first_name=user_data.name,
        last_name=user_data.surname or "",
        picture=user_data.picture,
    )
    db.add(user)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create user. Check google_id uniqueness.",
        ) from exc

    db.refresh(user)
    return user


def update_user(db: Session, user_id: int, user_data: UserUpdate):
    user = get_user(db, user_id)

    if user_data.name is not None:
        user.first_name = user_data.name
    if user_data.surname is not None:
        user.last_name = user_data.surname
    if user_data.email is not None:
        user.email = user_data.email
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
        deleted_count = user_repository.delete_users(db)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete users because related records exist.",
        ) from exc

    return {"deleted_count": deleted_count}

def login_user(db: Session, access_token: str):
    try:
        response = requests.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not connect to Google userinfo endpoint.",
        ) from exc

    if response.status_code == status.HTTP_401_UNAUTHORIZED:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google access token.",
        )
    if not response.ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not fetch user data from Google.",
        )

    profile = response.json()
    google_id = profile.get("sub")
    if not google_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google profile does not contain user id.",
        )

    first_name = profile.get("given_name") or profile.get("name") or ""
    last_name = profile.get("family_name") or ""

    statement = select(User).where(User.google_id == google_id)
    user = db.scalars(statement).one_or_none()

    if user is None:
        user = User(
            google_id=google_id,
            first_name=first_name,
            last_name=last_name,
            picture=profile.get("picture"),
        )
        db.add(user)
    else:
        user.email = profile.get("email")
        user.first_name = first_name
        user.last_name = last_name
        user.picture = profile.get("picture")

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not save Google user profile.",
        ) from exc

    db.refresh(user)
    return user
