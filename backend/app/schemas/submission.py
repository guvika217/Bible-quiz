"""Participant submission schemas."""

from uuid import UUID

from pydantic import BaseModel, Field


class ParticipantAnswerInput(BaseModel):
    """Submitted answer for a question in a quiz attempt."""

    question_id: UUID
    selected_answer: str = Field(min_length=1)


class AttemptSubmission(BaseModel):
    """Final batch submission payload for completing a participant attempt."""

    attempt_id: UUID
    answers: list[ParticipantAnswerInput]
    duration_seconds: int = Field(ge=0, default=0)
