"""API Version 1 Router Aggregator."""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.schemas.health import RootInfoResponse
from app.services.health_service import HealthService

api_v1_router = APIRouter()

# Register sub-routers
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)


@api_v1_router.get(
    "",
    response_model=RootInfoResponse,
    summary="API v1 Info",
    tags=["Root"],
)
async def get_v1_root() -> RootInfoResponse:
    return HealthService.get_root_info()
