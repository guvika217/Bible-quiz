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

    # CORS configuration
    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"]
    )

    # Server binding
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8000)


settings = Settings()
