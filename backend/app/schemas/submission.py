"""Participant submission schemas with speed and anti-cheat tracking."""

from uuid import UUID

from pydantic import BaseModel, Field


class ParticipantAnswerInput(BaseModel):
    """Submitted answer for a question with response time in seconds."""

    question_id: UUID
    selected_answer: str = Field(min_length=1)
    response_time_seconds: float = Field(ge=0.0, default=0.0, description="Time taken to answer this specific question")


class AttemptSubmission(BaseModel):
    """Final submission payload including warning counts and total duration."""

    attempt_id: UUID
    answers: list[ParticipantAnswerInput]
    duration_seconds: int = Field(ge=0, default=0)
    warning_count: int = Field(ge=0, default=0, description="Anti-cheat violation warnings (tab switch / window blur)")
