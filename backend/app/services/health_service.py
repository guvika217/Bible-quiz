"""Health and system status service."""


from app.core.config import settings
from app.schemas.health import HealthResponse, ReadinessResponse, RootInfoResponse


class HealthService:
    """Provides operational readiness and system diagnostics."""

    @staticmethod
    def get_health() -> HealthResponse:
        return HealthResponse(
            status="healthy",
            environment=settings.ENVIRONMENT,
            version=settings.PROJECT_VERSION,
        )

    @staticmethod
    def get_readiness() -> ReadinessResponse:
        subsystems: dict[str, str] = {
            "api": "operational",
            "memory": "operational",
        }
        return ReadinessResponse(
            status="ready",
            subsystems=subsystems,
        )

    @staticmethod
    def get_root_info() -> RootInfoResponse:
        return RootInfoResponse(
            name=settings.PROJECT_NAME,
            version=settings.PROJECT_VERSION,
            docs_url="/docs",
            api_v1=settings.API_V1_STR,
            status="online",
        )
