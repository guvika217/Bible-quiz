"""User repository for Cloudflare D1 data access."""

from typing import Any

from app.db.d1 import d1_client


class UserRepository:
    """Data access repository for the `users` table."""

    @staticmethod
    async def get_by_email(email: str) -> dict[str, Any] | None:
        """Find a user by email with RBAC fields."""
        sql = (
            "SELECT id, name, email, password_hash, role, email_verified, "
            "account_status, verified_at, created_at, updated_at "
            "FROM users WHERE lower(email) = lower(?) LIMIT 1;"
        )
        results = await d1_client.execute(sql, [email.strip()])
        return results[0] if results else None

    @staticmethod
    async def get_by_id(user_id: str) -> dict[str, Any] | None:
        """Find a user by UUID with RBAC fields."""
        sql = (
            "SELECT id, name, email, password_hash, role, email_verified, "
            "account_status, verified_at, created_at, updated_at "
            "FROM users WHERE id = ? LIMIT 1;"
        )
        results = await d1_client.execute(sql, [str(user_id)])
        return results[0] if results else None
