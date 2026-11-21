"""User management repository for SuperAdmin operations."""

from typing import Any

from app.db.d1 import d1_client


class AdminUserRepository:
    """SuperAdmin data operations on the `users` table."""

    @staticmethod
    async def list_all_admins() -> list[dict[str, Any]]:
        """List all administrators and superadmins."""
        sql = (
            "SELECT id, name, email, role, email_verified, account_status, "
            "verified_at, created_at, updated_at "
            "FROM users ORDER BY created_at ASC;"
        )
        return await d1_client.execute(sql)

    @staticmethod
    async def update_role(user_id: str, new_role: str) -> bool:
        """Promote or demote user role."""
        sql = "UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?;"
        await d1_client.execute(sql, [new_role, str(user_id)])
        return True

    @staticmethod
    async def update_status(user_id: str, new_status: str) -> bool:
        """Change user account status (ACTIVE, INACTIVE, SUSPENDED)."""
        sql = "UPDATE users SET account_status = ?, updated_at = datetime('now') WHERE id = ?;"
        await d1_client.execute(sql, [new_status, str(user_id)])
        return True

    @staticmethod
    async def get_system_counts() -> dict[str, int]:
        """Aggregate total platform figures for superadmin overview."""
        sql = (
            "SELECT "
            "(SELECT COUNT(*) FROM users) as total_admins, "
            "(SELECT COUNT(*) FROM users WHERE role = 'SUPER_ADMIN') as total_super_admins, "
            "(SELECT COUNT(*) FROM quizzes) as total_quizzes, "
            "(SELECT COUNT(*) FROM questions) as total_questions, "
            "(SELECT COUNT(*) FROM quiz_attempts) as total_attempts;"
        )
        results = await d1_client.execute(sql)
        return results[0] if results else {
            "total_admins": 0,
            "total_super_admins": 0,
            "total_quizzes": 0,
            "total_questions": 0,
            "total_attempts": 0,
        }
