"""Standard API response schemas."""

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str = Field(json_schema_extra={"example": "healthy"})
    environment: str = Field(json_schema_extra={"example": "development"})
    version: str = Field(json_schema_extra={"example": "0.1.0"})
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ReadinessResponse(BaseModel):
    """Readiness probe response schema."""

    status: str = Field(json_schema_extra={"example": "ready"})
    subsystems: dict[str, str] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class RootInfoResponse(BaseModel):
    """Root endpoint response schema."""

    name: str
    version: str
    docs_url: str
    api_v1: str
    status: str


class ErrorResponse(BaseModel):
    """Centralized error format schema."""

    error: str
    message: str
    status_code: int
    details: Any | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
