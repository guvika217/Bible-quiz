"""Authentication service for admin user verification and tokens."""

from typing import Any

from app.core.exceptions import AppException
from app.core.logging import logger
from app.core.security import create_access_token, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.user import AccountStatus, UserResponse, UserRole


class AuthService:
    """Business logic for authentication and RBAC."""

    @staticmethod
    async def authenticate_admin(email: str, password: str) -> dict[str, Any]:
        """Authenticate user credentials against Cloudflare D1.

        Verifies password hash, account status, and role.
        """
        user_record = await UserRepository.get_by_email(email)
        if not user_record:
            logger.warning(f"Failed login attempt: non-existent email '{email}'")
            raise AppException("Invalid email or password", status_code=401)

        password_hash = user_record.get("password_hash", "")
        if not verify_password(password, password_hash):
            logger.warning(f"Failed login attempt: invalid password for user '{email}'")
            raise AppException("Invalid email or password", status_code=401)

        # Verify account status
        status = user_record.get("account_status", "ACTIVE")
        if status == AccountStatus.SUSPENDED:
            logger.warning(f"Login denied: account is SUSPENDED for user '{email}'")
            raise AppException("Account is suspended. Contact administrator.", status_code=403)
        if status == AccountStatus.INACTIVE:
            logger.warning(f"Login denied: account is INACTIVE for user '{email}'")
            raise AppException("Account is inactive.", status_code=403)

        role = user_record.get("role", UserRole.ADMIN)

        # Generate JWT session token with subject and role claims
        token = create_access_token(subject=user_record["id"], role=role)

        user_response = UserResponse(
            id=user_record["id"],
            name=user_record["name"],
            email=user_record["email"],
            role=role,
            email_verified=bool(user_record.get("email_verified", 0)),
            account_status=status,
            verified_at=user_record.get("verified_at"),
            created_at=user_record["created_at"],
            updated_at=user_record["updated_at"],
        )

        logger.info(f"User successfully authenticated: {user_record['email']} (role: {role})")
        return {"user": user_response, "token": token}

    @staticmethod
    async def get_current_user(user_id: str) -> UserResponse:
        """Retrieve user profile by authenticated user UUID."""
        user_record = await UserRepository.get_by_id(user_id)
        if not user_record:
            raise AppException("User not found or session revoked", status_code=401)

        status = user_record.get("account_status", "ACTIVE")
        if status in (AccountStatus.SUSPENDED, AccountStatus.INACTIVE):
            raise AppException(f"Account is {status.lower()}", status_code=403)

        return UserResponse(
            id=user_record["id"],
            name=user_record["name"],
            email=user_record["email"],
            role=user_record.get("role", UserRole.ADMIN),
            email_verified=bool(user_record.get("email_verified", 0)),
            account_status=status,
            verified_at=user_record.get("verified_at"),
            created_at=user_record["created_at"],
            updated_at=user_record["updated_at"],
        )
