from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    secret_key: str = "secret-key-for-bearer-token-generation"

    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str

    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str

    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/callback/google"
    GITHUB_REDIRECT_URI: str = "http://localhost:3000/auth/callback/github"

settings = Settings()
