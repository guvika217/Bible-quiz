"""User Pydantic schemas with RBAC support."""

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRole(str, Enum):
    """User authorization roles."""

    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"


class AccountStatus(str, Enum):
    """User account lifecycle status."""

    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class UserBase(BaseModel):
    """Shared user attributes."""

    email: EmailStr = Field(description="Unique email address of the user")
    name: str = Field(min_length=1, max_length=100, description="Full name of the user")


class UserCreate(UserBase):
    """Schema for creating a new admin user."""

    password: str = Field(
        min_length=8,
        max_length=128,
        description="Plaintext password to be hashed by the backend",
    )
    role: UserRole = Field(default=UserRole.ADMIN, description="Assigned role")


class UserLogin(BaseModel):
    """Schema for user authentication request."""

    email: EmailStr = Field(description="User login email")
    password: str = Field(min_length=1, description="User password")


class UserUpdate(BaseModel):
    """Schema for updating an existing user."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = Field(default=None)
    role: UserRole | None = Field(default=None)
    account_status: AccountStatus | None = Field(default=None)
    password: str | None = Field(
        default=None,
        min_length=8,
        max_length=128,
        description="New password to set",
    )


class UserResponse(UserBase):
    """Public user response schema. Never exposes password_hash."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(description="Unique user UUID")
    role: UserRole = Field(description="User access role")
    email_verified: bool = Field(default=False, description="Whether email is verified")
    account_status: AccountStatus = Field(description="Account status")
    access_token: str | None = Field(default=None, description="JWT session token for dual cookie/header auth")
    verified_at: datetime | None = Field(default=None, description="Verification timestamp")
    created_at: datetime = Field(description="Creation timestamp in UTC")
    updated_at: datetime = Field(description="Last update timestamp in UTC")
