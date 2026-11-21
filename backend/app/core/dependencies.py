"""Authentication dependencies for protected routes."""

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.security import decode_access_token
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

# Optional header bearer fallback for API clients
security_bearer = HTTPBearer(auto_error=False)


async def get_current_admin(
    request: Request,
    bearer_auth: HTTPAuthorizationCredentials | None = Depends(security_bearer),
) -> UserResponse:
    """Dependency that extracts and validates the admin session.

    Checks HttpOnly cookie first, then Bearer authorization header.
    Raises 401 if missing, invalid, or expired.
    """
    token: str | None = None

    # 1. Prefer HttpOnly cookie
    if settings.AUTH_COOKIE_NAME in request.cookies:
        token = request.cookies[settings.AUTH_COOKIE_NAME]

    # 2. Fallback to Authorization Header
    elif bearer_auth and bearer_auth.credentials:
        token = bearer_auth.credentials

    if not token:
        raise AppException("Not authenticated", status_code=401)

    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise AppException("Authentication session is invalid or has expired", status_code=401)

    user_id = payload["sub"]
    return await AuthService.get_current_user(user_id)
