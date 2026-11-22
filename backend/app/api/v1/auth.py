"""Authentication API routes with RBAC verification."""

from fastapi import APIRouter, Depends, Response, status

from app.core.config import settings
from app.core.dependencies import get_current_user, require_super_admin
from app.schemas.user import UserLogin, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin Login",
    description="Authenticates credentials, sets an HttpOnly JWT session cookie, and returns user data with role.",
)
async def login(credentials: UserLogin, response: Response) -> UserResponse:
    result = await AuthService.authenticate_admin(
        email=str(credentials.email),
        password=credentials.password,
    )

    token = result["token"]
    user: UserResponse = result["user"]

    # Set secure HttpOnly cookie with JWT
    # In production, when frontend (vercel) and backend (render) are on different domains,
    # samesite="none" and secure=True are required for the browser to send cookies cross-origin.
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=True if settings.ENVIRONMENT == "production" else settings.AUTH_COOKIE_SECURE,
        samesite="none" if settings.ENVIRONMENT == "production" else settings.AUTH_COOKIE_SAMESITE,
        path="/",
    )

    user.access_token = token
    return user


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Admin Logout",
    description="Clears the active authentication session cookie.",
)
async def logout(response: Response) -> dict[str, str]:
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
    return {"message": "Successfully logged out"}


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current Authenticated User",
    description="Validates the active session and returns user profile with RBAC role.",
)
async def me(admin: UserResponse = Depends(get_current_user)) -> UserResponse:
    return admin


@router.get(
    "/superadmin-only",
    response_model=dict[str, str],
    status_code=status.HTTP_200_OK,
    summary="SUPER_ADMIN Only Protected Resource",
    description="Demonstrates role-based access control blocking standard ADMIN role.",
)
async def superadmin_test(
    super_admin: UserResponse = Depends(require_super_admin),
) -> dict[str, str]:
    return {
        "message": f"Welcome, Super Administrator {super_admin.name}. You have unrestricted access.",
        "role": super_admin.role,
    }
