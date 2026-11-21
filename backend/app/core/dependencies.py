"""Authentication dependencies and Role-Based Access Control (RBAC)."""

from collections.abc import Callable

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.security import decode_access_token
from app.schemas.user import UserResponse, UserRole
from app.services.auth_service import AuthService

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    bearer_auth: HTTPAuthorizationCredentials | None = Depends(security_bearer),
) -> UserResponse:
    """Extract and validate JWT session token.

    Validates signature, expiration, and loads active user profile.
    """
    token: str | None = None

    # 1. Prefer HttpOnly cookie
    if settings.AUTH_COOKIE_NAME in request.cookies:
        token = request.cookies[settings.AUTH_COOKIE_NAME]

    # 2. Fallback to Authorization Bearer header
    elif bearer_auth and bearer_auth.credentials:
        token = bearer_auth.credentials

    if not token:
        raise AppException("Not authenticated", status_code=401)

    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise AppException("Authentication session is invalid or has expired", status_code=401)

    user_id = payload["sub"]
    return await AuthService.get_current_user(user_id)


def require_role(*allowed_roles: UserRole) -> Callable[[UserResponse], UserResponse]:
    """Role-based authorization dependency factory.

    Verifies the authenticated user holds one of the required roles.
    """
    async def role_checker(
        current_user: UserResponse = Depends(get_current_user),
    ) -> UserResponse:
        if current_user.role not in allowed_roles:
            raise AppException(
                f"Access denied: role '{current_user.role}' is not authorized for this resource.",
                status_code=403,
            )
        return current_user

    return role_checker


# Reusable role guards
require_admin = require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)
require_super_admin = require_role(UserRole.SUPER_ADMIN)
