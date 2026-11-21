"""Question Pydantic schemas."""

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class QuestionType(str, Enum):
    """Supported question types."""

    SINGLE_CHOICE = "single_choice"
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"


class QuestionBase(BaseModel):
    """Shared question properties."""

    question_text: str = Field(min_length=1, max_length=2000, description="The question prompt")
    question_type: QuestionType = Field(description="Format of the question")
    options: list[str] = Field(min_length=2, max_length=10, description="List of possible answer options")
    explanation: str | None = Field(default=None, max_length=2000, description="Scriptural context or rationale")
    points: int = Field(default=1, gt=0, description="Points awarded for a correct answer")
    order_index: int = Field(ge=0, description="Display order index within the quiz")

    @field_validator("question_text")
    @classmethod
    def validate_question_text_not_empty(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Question text cannot be empty or only whitespace")
        return trimmed

    @field_validator("options")
    @classmethod
    def validate_options_content(cls, options: list[str]) -> list[str]:
        cleaned = [opt.strip() for opt in options]
        if any(not opt for opt in cleaned):
            raise ValueError("Options must not contain empty strings")
        if len(set(cleaned)) != len(cleaned):
            raise ValueError("Options must be unique")
        return cleaned


class QuestionCreate(QuestionBase):
    """Schema for creating a new question (requires correct_answer)."""

    quiz_id: UUID = Field(description="Target quiz UUID")
    correct_answer: str = Field(min_length=1, description="Canonical correct answer string or JSON array")

    @model_validator(mode="after")
    def validate_correct_answer_matches_type(self) -> "QuestionCreate":
        options_set = set(self.options)
        if self.question_type in (QuestionType.SINGLE_CHOICE, QuestionType.TRUE_FALSE):
            if self.correct_answer not in options_set:
                raise ValueError(
                    f"Correct answer '{self.correct_answer}' must be one of the defined options: {self.options}"
                )
        elif self.question_type == QuestionType.MULTIPLE_CHOICE:
            import json
            try:
                answers = json.loads(self.correct_answer)
                if not isinstance(answers, list) or not answers:
                    raise ValueError("Multiple choice correct_answer must be a non-empty JSON list of strings")
                for ans in answers:
                    if ans not in options_set:
                        raise ValueError(f"Correct answer '{ans}' is not in options: {self.options}")
            except json.JSONDecodeError:
                # If provided as plain string, check if it's one of the options
                if self.correct_answer not in options_set:
                    raise ValueError(f"Correct answer '{self.correct_answer}' is not in options: {self.options}")

        if self.question_type == QuestionType.TRUE_FALSE:
            normalized_options = {opt.lower() for opt in self.options}
            if not ({"true", "false"}.issubset(normalized_options) or {"yes", "no"}.issubset(normalized_options)):
                raise ValueError("true_false questions must include True and False in options")
        return self


class QuestionUpdate(BaseModel):
    """Schema for updating an existing question."""

    question_text: str | None = Field(default=None, min_length=1, max_length=2000)
    question_type: QuestionType | None = Field(default=None)
    options: list[str] | None = Field(default=None, min_length=2, max_length=10)
    correct_answer: str | None = Field(default=None, min_length=1)
    explanation: str | None = Field(default=None, max_length=2000)
    points: int | None = Field(default=None, gt=0)
    order_index: int | None = Field(default=None, ge=0)


class ParticipantQuestionResponse(QuestionBase):
    """Question presentation for participants. MUST NOT expose correct_answer."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(description="Question UUID")
    quiz_id: UUID = Field(description="Parent quiz UUID")


class AdminQuestionResponse(QuestionBase):
    """Admin question representation containing correct_answer and management metadata."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(description="Question UUID")
    quiz_id: UUID = Field(description="Parent quiz UUID")
    correct_answer: str = Field(description="Correct answer")
    created_at: datetime = Field(description="Created timestamp in UTC")
    updated_at: datetime = Field(description="Updated timestamp in UTC")


# Default QuestionResponse alias for standard administrative use
QuestionResponse = AdminQuestionResponse
