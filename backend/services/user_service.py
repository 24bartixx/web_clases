from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.user import User
from repositories import user_repository
from schemas.user_schema import UserBase, UserUpdate


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
