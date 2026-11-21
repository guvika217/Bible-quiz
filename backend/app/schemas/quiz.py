"""Quiz Pydantic schemas."""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class QuizStatus(str, Enum):
    """Supported quiz lifecycle statuses."""

    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class QuizBase(BaseModel):
    """Shared quiz attributes."""

    title: str = Field(min_length=1, max_length=255, description="Title of the quiz")
    description: str | None = Field(default=None, max_length=2000, description="Optional quiz description")
    time_limit_seconds: int | None = Field(
        default=None,
        gt=0,
        description="Time limit per attempt in seconds, must be positive if set",
    )
    settings: dict[str, Any] = Field(
        default_factory=dict,
        description="Arbitrary quiz configuration options stored as JSON",
    )

    @field_validator("title")
    @classmethod
    def validate_title_not_empty(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Title must contain non-whitespace characters")
        return trimmed


class QuizCreate(QuizBase):
    """Schema for creating a new quiz."""

    join_code: str | None = Field(
        default=None,
        min_length=4,
        max_length=12,
        pattern=r"^[A-Z0-9_-]+$",
        description="Optional join code. If omitted, backend generates one automatically",
    )


class QuizUpdate(BaseModel):
    """Schema for updating an existing quiz."""

    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    status: QuizStatus | None = Field(default=None, description="Quiz lifecycle status")
    time_limit_seconds: int | None = Field(default=None, gt=0)
    settings: dict[str, Any] | None = Field(default=None)

    @field_validator("title")
    @classmethod
    def validate_title_not_empty(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Title must contain non-whitespace characters")
        return value.strip() if value else None


class QuizResponse(QuizBase):
    """Public/Admin detailed quiz representation."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(description="Unique quiz UUID")
    owner_id: UUID = Field(description="Owner admin user UUID")
    join_code: str = Field(description="Unique participation join code")
    status: QuizStatus = Field(description="Current quiz status")
    question_count: int = Field(ge=0, description="Number of questions in this quiz")
    created_at: datetime = Field(description="Creation timestamp in UTC")
    updated_at: datetime = Field(description="Last update timestamp in UTC")
    started_at: datetime | None = Field(default=None, description="Start timestamp")
    ended_at: datetime | None = Field(default=None, description="End timestamp")


class QuizListResponse(BaseModel):
    """Paginated or grouped quiz collection response."""

    items: list[QuizResponse] = Field(default_factory=list)
    total: int = Field(ge=0)
