from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from core.config import settings
from db.database import get_db
from schemas.user_schema import UserLoginData, UserRead
from services import user_service

router = APIRouter()

@router.get("/authorize/{provider}")
def authorize_provider(provider: str):
    try:
        auth_url = user_service.get_oauth_authorization_url(provider)
        return {"url": auth_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nie udało się wygenerować linku dla {provider}: {str(e)}"
        )

@router.post("/callback/{provider}", response_model=UserRead)
def login_user_callback(
    provider: str,
    user_login_data: UserLoginData,
    response: Response,
    db: Session = Depends(get_db),
):
    user_read = user_service.login_oauth_user(db, provider, user_login_data.code)
    
    response.set_cookie(
        key="access_token",
        value=user_read.bearer_token,
        httponly=True,
        path="/",
        secure=False,
        samesite="lax",
        max_age=3600,
    )

    user_read.bearer_token = None
    return user_read