"""Authentication API routes."""

from fastapi import APIRouter, Depends, Response, status

from app.core.config import settings
from app.core.dependencies import get_current_admin
from app.schemas.user import UserLogin, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Admin Login",
    description="Authenticates admin credentials, sets an HttpOnly session cookie, and returns safe user data.",
)
async def login(credentials: UserLogin, response: Response) -> UserResponse:
    result = await AuthService.authenticate_admin(
        email=str(credentials.email),
        password=credentials.password,
    )

    token = result["token"]
    user: UserResponse = result["user"]

    # Set secure HttpOnly cookie
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/",
    )

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
    summary="Get Current Authenticated Admin",
    description="Validates the active session and returns the current admin's profile.",
)
async def get_current_user(admin: UserResponse = Depends(get_current_admin)) -> UserResponse:
    return admin
