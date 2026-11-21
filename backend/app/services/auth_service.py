"""Authentication service for admin user verification and tokens."""

from typing import Any

from app.core.exceptions import AppException
from app.core.logging import logger
from app.core.security import create_access_token, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserResponse


class AuthService:
    """Business logic for admin authentication."""

    @staticmethod
    async def authenticate_admin(email: str, password: str) -> dict[str, Any]:
        """Authenticate admin credentials against Cloudflare D1.

        Returns user data and access token on success.
        Raises 401 on invalid credentials.
        """
        user_record = await UserRepository.get_by_email(email)
        if not user_record:
            logger.warning(f"Failed login attempt: non-existent email '{email}'")
            raise AppException("Invalid email or password", status_code=401)

        password_hash = user_record.get("password_hash", "")
        if not verify_password(password, password_hash):
            logger.warning(f"Failed login attempt: invalid password for user '{email}'")
            raise AppException("Invalid email or password", status_code=401)

        # Generate JWT session token
        token = create_access_token(subject=user_record["id"])

        user_response = UserResponse(
            id=user_record["id"],
            name=user_record["name"],
            email=user_record["email"],
            created_at=user_record["created_at"],
            updated_at=user_record["updated_at"],
        )

        logger.info(f"Admin user successfully authenticated: {user_record['email']}")
        return {"user": user_response, "token": token}

    @staticmethod
    async def get_current_user(user_id: str) -> UserResponse:
        """Retrieve user profile by authenticated user UUID."""
        user_record = await UserRepository.get_by_id(user_id)
        if not user_record:
            raise AppException("User not found or session revoked", status_code=401)

        return UserResponse(
            id=user_record["id"],
            name=user_record["name"],
            email=user_record["email"],
            created_at=user_record["created_at"],
            updated_at=user_record["updated_at"],
        )
