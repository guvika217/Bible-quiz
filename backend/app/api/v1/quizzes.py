"""Quiz and Leaderboard API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.schemas.leaderboard import QuizPerformanceAnalytics
from app.schemas.quiz import QuizCreate, QuizResponse
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
    description="Create a new Bible quiz. Requires authenticated Admin.",
)
async def create_quiz(
    quiz_in: QuizCreate,
    current_admin: UserResponse = Depends(get_current_user),
) -> QuizResponse:
    return await QuizService.create_quiz(quiz_in, current_admin.id)


@router.get(
    "/{quiz_id}/performance",
    response_model=QuizPerformanceAnalytics,
    status_code=status.HTTP_200_OK,
    summary="Get Quiz Performance Analytics and Leaderboard",
    description="Returns participant leaderboard rankings and performance distribution metrics for the quiz.",
)
async def get_quiz_performance(
    quiz_id: UUID,
) -> QuizPerformanceAnalytics:
    return await QuizService.get_performance_analytics(quiz_id)
