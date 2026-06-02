from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from core.auth import get_current_user
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
):
    return user_service.get_users(db, skip=skip, limit=limit)


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
):
    return user_service.create_user(db, user_data)


@router.get("/google/{google_id}", response_model=UserRead)
def get_user_by_google_id(
    google_id: str,
    db: Session = Depends(get_db),
):
    return user_service.get_user_by_google_id(db, google_id)


@router.get("/info", response_model=UserRead)
def get_user(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    return user_service.get_user(db, user_id)


@router.patch("/{user_id}", response_model=UserRead)
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


# post due to security reasons
@router.post("/login", response_model=UserRead)
def login_user(
    user_login_data: UserLoginData,
    response: Response,
    db: Session = Depends(get_db),
):
    user_read = user_service.login_user(db, user_login_data.access_token)
    
    # Set httpOnly cookie with token
    response.set_cookie(
        key="access_token",
        value=user_read.bearer_token,
        httponly=True,
        path="/",
        secure=False,
        samesite="lax",
        max_age=3600,
    )
    
    # Return user without token in body
    user_read.bearer_token = None
    return user_read
