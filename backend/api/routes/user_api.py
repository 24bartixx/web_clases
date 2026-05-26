from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.user_schema import UserBase, UserUpdate
from services import user_service

router = APIRouter()


@router.get("/")
def get_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return user_service.get_users(db, skip=skip, limit=limit)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserBase,
    db: Session = Depends(get_db),
):
    return user_service.create_user(db, user_data)


@router.get("/google/{google_id}")
def get_user_by_google_id(
    google_id: str,
    db: Session = Depends(get_db),
):
    return user_service.get_user_by_google_id(db, google_id)


@router.get("/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    return user_service.get_user(db, user_id)


@router.patch("/{user_id}")
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
):
    return user_service.update_user(db, user_id, user_data)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    user_service.delete_user(db, user_id)


@router.delete("/")
def delete_users(
    db: Session = Depends(get_db),
):
    return user_service.delete_users(db)

@router.put("/login")
def login_user(
    access_token: str,
    db: Session = Depends(get_db),
):
    return user_service.login_user(db, access_token)
