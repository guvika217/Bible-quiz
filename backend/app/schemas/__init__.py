"""Schemas package aggregator."""

from app.schemas.answer import AnswerResponse, AnswerSubmit
from app.schemas.attempt import (
    AttemptJoin,
    AttemptResponse,
    AttemptResultResponse,
    CompletionStatus,
)
from app.schemas.health import (
    ErrorResponse,
    HealthResponse,
    ReadinessResponse,
    RootInfoResponse,
)
from app.schemas.question import (
    AdminQuestionResponse,
    ParticipantQuestionResponse,
    QuestionCreate,
    QuestionResponse,
    QuestionType,
    QuestionUpdate,
)
from app.schemas.quiz import (
    QuizCreate,
    QuizListResponse,
    QuizResponse,
    QuizStatus,
    QuizUpdate,
)
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
)

__all__ = [
    "AdminQuestionResponse",
    "AnswerResponse",
    # Answer
    "AnswerSubmit",
    "AttemptJoin",
    "AttemptResponse",
    "AttemptResultResponse",
    # Attempt
    "CompletionStatus",
    "ErrorResponse",
    # Health
    "HealthResponse",
    "ParticipantQuestionResponse",
    "QuestionCreate",
    "QuestionResponse",
    # Question
    "QuestionType",
    "QuestionUpdate",
    "QuizCreate",
    "QuizListResponse",
    "QuizResponse",
    # Quiz
    "QuizStatus",
    "QuizUpdate",
    "ReadinessResponse",
    "RootInfoResponse",
    # User
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "UserUpdate",
]
