"""Answer Pydantic schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AnswerSubmit(BaseModel):
    """Schema submitted by a participant for an answer.

    Participants CANNOT submit is_correct or points_awarded; those are
    computed solely by the backend business logic.
    """

    attempt_id: UUID = Field(description="Active attempt UUID")
    question_id: UUID = Field(description="Target question UUID")
    selected_answer: str = Field(min_length=1, max_length=1000, description="Submitted answer string or JSON array")

    @field_validator("selected_answer")
    @classmethod
    def validate_answer_not_empty(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Selected answer cannot be empty or only whitespace")
        return trimmed


class AnswerResponse(BaseModel):
    """Calculated answer record response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(description="Answer submission UUID")
    attempt_id: UUID = Field(description="Attempt UUID")
    question_id: UUID = Field(description="Question UUID")
    selected_answer: str = Field(description="Answer submitted")
    is_correct: bool = Field(description="Evaluated boolean outcome")
    points_awarded: int = Field(ge=0, description="Points awarded by the backend")
    answered_at: datetime = Field(description="Timestamp when answer was recorded")
