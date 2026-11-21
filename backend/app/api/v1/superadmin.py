"""SuperAdmin API routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field

from app.core.dependencies import require_super_admin
from app.repositories.admin_user_repository import AdminUserRepository
from app.schemas.user import AccountStatus, UserResponse, UserRole

router = APIRouter(prefix="/superadmin", tags=["SuperAdmin"])


class RoleUpdateRequest(BaseModel):
    role: UserRole = Field(description="New role to assign")


class StatusUpdateRequest(BaseModel):
    account_status: AccountStatus = Field(description="New account status")


class SystemStatsResponse(BaseModel):
    total_admins: int
    total_super_admins: int
    total_quizzes: int
    total_questions: int
    total_attempts: int


@router.get(
    "/stats",
    response_model=SystemStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get System Statistics",
    description="Aggregated platform statistics. Requires SUPER_ADMIN role.",
)
async def get_system_stats(
    _: UserResponse = Depends(require_super_admin),
) -> SystemStatsResponse:
    stats = await AdminUserRepository.get_system_counts()
    return SystemStatsResponse(
        total_admins=stats.get("total_admins", 0),
        total_super_admins=stats.get("total_super_admins", 0),
        total_quizzes=stats.get("total_quizzes", 0),
        total_questions=stats.get("total_questions", 0),
        total_attempts=stats.get("total_attempts", 0),
    )


@router.get(
    "/users",
    response_model=list[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="List All System Users",
    description="List all administrators and superadmins. Requires SUPER_ADMIN role.",
)
async def list_users(
    _: UserResponse = Depends(require_super_admin),
) -> list[UserResponse]:
    records = await AdminUserRepository.list_all_admins()
    return [
        UserResponse(
            id=r["id"],
            name=r["name"],
            email=r["email"],
            role=r["role"],
            email_verified=bool(r.get("email_verified", 0)),
            account_status=r["account_status"],
            verified_at=r.get("verified_at"),
            created_at=r["created_at"],
            updated_at=r["updated_at"],
        )
        for r in records
    ]


@router.patch(
    "/users/{user_id}/role",
    status_code=status.HTTP_200_OK,
    summary="Update User Role",
    description="Change administrator role (SUPER_ADMIN or ADMIN). Requires SUPER_ADMIN role.",
)
async def update_user_role(
    user_id: UUID,
    payload: RoleUpdateRequest,
    _: UserResponse = Depends(require_super_admin),
) -> dict[str, str]:
    await AdminUserRepository.update_role(str(user_id), payload.role.value)
    return {"message": f"User role updated to {payload.role.value}"}


@router.patch(
    "/users/{user_id}/status",
    status_code=status.HTTP_200_OK,
    summary="Update Account Status",
    description="Change account status (ACTIVE, INACTIVE, SUSPENDED). Requires SUPER_ADMIN role.",
)
async def update_account_status(
    user_id: UUID,
    payload: StatusUpdateRequest,
    _: UserResponse = Depends(require_super_admin),
) -> dict[str, str]:
    await AdminUserRepository.update_status(str(user_id), payload.account_status.value)
    return {"message": f"Account status updated to {payload.account_status.value}"}
