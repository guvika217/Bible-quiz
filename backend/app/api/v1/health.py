"""Health check routes."""

from fastapi import APIRouter, status

from app.schemas.health import HealthResponse, ReadinessResponse
from app.services.health_service import HealthService

router = APIRouter(prefix="/health", tags=["Health"])


@router.get(
    "",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Application Health Probe",
    description="Returns high-level health information about the application.",
)
async def get_health() -> HealthResponse:
    return HealthService.get_health()


@router.get(
    "/ready",
    response_model=ReadinessResponse,
    status_code=status.HTTP_200_OK,
    summary="Application Readiness Probe",
    description="Returns detailed readiness checks for infrastructure orchestration.",
)
async def get_readiness() -> ReadinessResponse:
    return HealthService.get_readiness()
