import secrets
from abc import ABC, abstractmethod
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from core.config import settings
from models.user import User
from schemas.oauth_schema import GitHubProfile, GoogleProfile
from schemas.user_schema import UserRead

class OAuthProvider(ABC):
    @property
    @abstractmethod
    def auth_url(self) -> str:
        pass

    @property
    @abstractmethod
    def token_url(self) -> str:
        pass

    @abstractmethod
    def get_auth_params(self, state: str) -> dict:
        pass

    @abstractmethod
    def build_token_payload(self, code: str) -> dict:
        pass

    @abstractmethod
    async def fetch_profile(self, access_token: str, client: httpx.AsyncClient) -> Any:
        pass


class GoogleOAuthProvider(OAuthProvider):
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
    token_url = "https://oauth2.googleapis.com/token"
    user_url = "https://www.googleapis.com/oauth2/v3/userinfo"

    def get_auth_params(self, state: str) -> dict:
        return {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "scope": "openid email profile",
            "response_type": "code",
            "access_type": "offline",
            "prompt": "select_account",
            "state": state,
        }

    def build_token_payload(self, code: str) -> dict:
        return {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

    async def fetch_profile(self, access_token: str, client: httpx.AsyncClient) -> GoogleProfile:
        response = await client.get(
            self.user_url, 
            headers={"Authorization": f"Bearer {access_token}"}
        )
        response.raise_for_status()
        return GoogleProfile.model_validate(response.json())


class GitHubOAuthProvider(OAuthProvider):
    auth_url = "https://github.com/login/oauth/authorize"
    token_url = "https://github.com/login/oauth/access_token"
    user_url = "https://api.github.com/user"

    def get_auth_params(self, state: str) -> dict:
        return {
            "client_id": settings.GITHUB_CLIENT_ID,
            "redirect_uri": settings.GITHUB_REDIRECT_URI,
            "scope": "read:user user:email",
            "state": state,
        }

    def build_token_payload(self, code: str) -> dict:
        return {
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": settings.GITHUB_REDIRECT_URI,
        }

    async def fetch_profile(self, access_token: str, client: httpx.AsyncClient) -> GitHubProfile:
        response = await client.get(
            self.user_url, 
            headers={"Authorization": f"Bearer {access_token}"}
        )
        response.raise_for_status()
        profile_json = response.json()
        
        profile = GitHubProfile.model_validate(profile_json)
        
        if not profile.email:
            try:
                email_res = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                email_res.raise_for_status()
                emails_list = email_res.json()
                primary_email = next((e["email"] for e in emails_list if e.get("primary")), None)
                profile.email = primary_email or (emails_list[0]["email"] if emails_list else None)
            except httpx.HTTPError:
                print("Failed to fetch GitHub emails") 

        if not profile.email:
            profile.email = f"{profile.id}+{profile.login}@users.noreply.github.com"
            
        return profile


def get_provider(provider_name: str) -> OAuthProvider:
    providers = {
        "google": GoogleOAuthProvider,
        "github": GitHubOAuthProvider,
    }
    provider_class = providers.get(provider_name.lower())
    if not provider_class:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Provider {provider_name} is not supported."
        )
    return provider_class()