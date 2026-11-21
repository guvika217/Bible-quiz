"""Attempt Pydantic schemas."""

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CompletionStatus(str, Enum):
    """Participant quiz attempt statuses."""

    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class AttemptJoin(BaseModel):
    """Schema for a participant joining a quiz."""

    join_code: str = Field(min_length=4, max_length=12, description="Quiz join code")
    participant_name: str = Field(
        min_length=1,
        max_length=50,
        description="Display name of the participant",
    )

    @field_validator("participant_name")
    @classmethod
    def validate_name_not_empty(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Participant name cannot be blank or only whitespace")
        return trimmed

    @field_validator("join_code")
    @classmethod
    def clean_join_code(cls, value: str) -> str:
        return value.strip().upper()


class AttemptResponse(BaseModel):
    """General response representing an active participant attempt."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(description="Attempt UUID")
    quiz_id: UUID = Field(description="Quiz UUID")
    participant_name: str = Field(description="Participant display name")
    completion_status: CompletionStatus = Field(description="Current status of the attempt")
    started_at: datetime = Field(description="When the attempt was initiated")


class AttemptResultResponse(AttemptResponse):
    """Detailed score summary for an attempt. Backend calculated only."""

    score: int = Field(ge=0, description="Earned points score")
    max_score: int = Field(ge=0, description="Maximum possible points")
    correct_count: int = Field(ge=0, description="Count of correct answers")
    incorrect_count: int = Field(ge=0, description="Count of incorrect answers")
    completed_at: datetime | None = Field(default=None, description="Completion timestamp")
    duration_seconds: int | None = Field(default=None, ge=0, description="Duration in seconds")
