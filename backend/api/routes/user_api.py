from http.client import HTTPException

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from core.auth import get_current_admin, get_current_user
from db.database import get_db
from models.user import User
from schemas.user_schema import UserCreate, UserLoginData, UserRead, UserUpdate
from services import user_service

router = APIRouter()


@router.get("/", response_model=list[UserRead])
def get_users(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    return user_service.get_users(db, skip=skip, limit=limit)

@router.get("/me", response_model=UserRead)
def get_user(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.patch("/me", response_model=UserRead)
def update_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return user_service.update_user(db, current_user.user_id, user_data)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_service.delete_user(db, current_user.user_id)


@router.delete("/")
def delete_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    return user_service.delete_users(db)