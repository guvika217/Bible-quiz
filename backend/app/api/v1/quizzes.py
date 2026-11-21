"""Quiz, Question, and Participant Play API endpoints."""

from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.schemas.attempt import AttemptJoin, AttemptResultResponse
from app.schemas.leaderboard import QuizPerformanceAnalytics
from app.schemas.question import AdminQuestionResponse, QuestionCreate
from app.schemas.quiz import QuizCreate, QuizResponse
from app.schemas.submission import AttemptSubmission
from app.schemas.user import UserResponse
from app.services.quiz_service import QuizService

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.get(
    "",
    response_model=list[QuizResponse],
    status_code=status.HTTP_200_OK,
    summary="List Quizzes",
    description="Retrieve all available quizzes.",
)
async def list_quizzes() -> list[QuizResponse]:
    return await QuizService.list_quizzes()


@router.post(
    "",
    response_model=QuizResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Quiz",
    description="Create a new Bible quiz. Returns default-generated UUID and join code.",
)
async def create_quiz(
    quiz_in: QuizCreate,
    current_admin: UserResponse = Depends(get_current_user),
) -> QuizResponse:
    return await QuizService.create_quiz(quiz_in, current_admin.id)


@router.get(
    "/{quiz_id}",
    response_model=QuizResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Quiz Details",
)
async def get_quiz(quiz_id: UUID) -> QuizResponse:
    return await QuizService.get_quiz(quiz_id)


# --- QUESTIONS MANAGEMENT FOR QUIZ CREATOR ---

@router.get(
    "/{quiz_id}/questions",
    response_model=list[AdminQuestionResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Quiz Questions for Admin",
)
async def get_questions(
    quiz_id: UUID,
    _: UserResponse = Depends(get_current_user),
) -> list[AdminQuestionResponse]:
    return await QuizService.get_admin_questions(quiz_id)


@router.post(
    "/{quiz_id}/questions",
    response_model=AdminQuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add Question to Quiz",
    description="Add question with 4 choices, selected correct answer, and scripture reference.",
)
async def add_question(
    quiz_id: UUID,
    q_in: QuestionCreate,
    _: UserResponse = Depends(get_current_user),
) -> AdminQuestionResponse:
    return await QuizService.add_question(quiz_id, q_in)


@router.delete(
    "/{quiz_id}/questions/{question_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Question",
)
async def delete_question(
    quiz_id: UUID,
    question_id: UUID,
    _: UserResponse = Depends(get_current_user),
) -> dict[str, str]:
    await QuizService.delete_question(quiz_id, question_id)
    return {"message": "Question deleted successfully"}


# --- PUBLIC PARTICIPANT PLAY FLOW ---

@router.get(
    "/public/{join_code}",
    status_code=status.HTTP_200_OK,
    summary="Public Quiz Info for Participant",
)
async def get_public_quiz(join_code: str) -> dict[str, Any]:
    return await QuizService.get_public_quiz_info(join_code)


@router.post(
    "/public/join",
    status_code=status.HTTP_200_OK,
    summary="Participant Joins Quiz",
    description="Collects participant name and join code, returns attempt session and questions.",
)
async def join_quiz(join_input: AttemptJoin) -> dict[str, Any]:
    return await QuizService.join_quiz(join_input)


@router.post(
    "/public/submit",
    response_model=AttemptResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit Participant Quiz Answers",
    description="Submits completed answers, grades responses in DB, and computes score.",
)
async def submit_quiz(submission: AttemptSubmission) -> AttemptResultResponse:
    return await QuizService.submit_attempt(submission)


# --- LEADERBOARD & PERFORMANCE ---

@router.get(
    "/{quiz_id}/performance",
    response_model=QuizPerformanceAnalytics,
    status_code=status.HTTP_200_OK,
    summary="Get Quiz Performance Analytics and Leaderboard",
)
async def get_quiz_performance(quiz_id: UUID) -> QuizPerformanceAnalytics:
    return await QuizService.get_performance_analytics(quiz_id)
