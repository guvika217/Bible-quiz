"""Backend configuration settings using Pydantic Settings."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = Field(default="Bible Quiz Platform API")
    PROJECT_VERSION: str = Field(default="0.1.0")
    API_V1_STR: str = Field(default="/api/v1")
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=True)

    # CORS configuration (supports comma-separated origins string or list)
    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    # Server binding
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)

    # Cloudflare D1 Database Integration
    CLOUDFLARE_API_TOKEN: str = Field(default="")
    CLOUDFLARE_ACCOUNT_ID: str = Field(default="")
    CLOUDFLARE_D1_DATABASE_ID: str = Field(default="")

    # Authentication & Session Security
    SECRET_KEY: str = Field(
        default="super-secret-bible-quiz-enterprise-session-key-change-in-production"
    )
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 24)  # 24 hours
    AUTH_COOKIE_NAME: str = Field(default="admin_access_token")
    AUTH_COOKIE_SECURE: bool = Field(default=False)  # True in production
    AUTH_COOKIE_SAMESITE: str = Field(default="lax")


settings = Settings()
