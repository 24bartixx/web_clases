from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from core.config import settings
from db.database import get_db
from schemas.user_schema import UserLoginData, UserRead
from services import user_service

router = APIRouter()
@router.get("/authorize/{provider}")
def authorize_provider(provider: str, response: Response):
    try:
        auth_url, state = user_service.get_oauth_authorization_url(provider)
        response.set_cookie(
            key="oauth_state",
            value=state,
            httponly=True,
            max_age=600,
            samesite="lax",
            path="/",
        )
        return {"url": auth_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nie udało się wygenerować linku dla {provider}: {str(e)}"
        )

@router.post("/callback/{provider}", response_model=UserRead)
async def login_user_callback(
    provider: str,
    user_login_data: UserLoginData,
    response: Response,
    db: Session = Depends(get_db),
    oauth_state: str | None = Cookie(None),
):
    user_read = await user_service.login_oauth_user(
        db=db, 
        provider=provider, 
        code=user_login_data.code,
        state_from_url=user_login_data.state,
        state_from_cookie=oauth_state 
    )
    
    response.set_cookie(
        key="access_token",
        value=user_read.bearer_token,
        httponly=True,
        path="/",
        secure=False,
        samesite="lax",
        max_age=3600,
    )

    response.delete_cookie(key="oauth_state", path="/")

    user_read.bearer_token = None
    return user_read

@router.post("/logout")
def logout_user(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logged out successfully"}