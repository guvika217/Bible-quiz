"""Quiz and Leaderboard repository using Cloudflare D1."""

from typing import Any

from app.db.d1 import d1_client


class QuizRepository:
    """Data access repository for quizzes and participant attempts."""

    @staticmethod
    async def list_quizzes(limit: int = 50) -> list[dict[str, Any]]:
        """List quizzes ordered by creation date."""
        sql = (
            "SELECT id, owner_id, title, description, join_code, status, "
            "question_count, time_limit_seconds, settings, created_at, updated_at "
            "FROM quizzes ORDER BY created_at DESC LIMIT ?;"
        )
        return await d1_client.execute(sql, [limit])

    @staticmethod
    async def get_by_id(quiz_id: str) -> dict[str, Any] | None:
        """Fetch single quiz by UUID."""
        sql = (
            "SELECT id, owner_id, title, description, join_code, status, "
            "question_count, time_limit_seconds, settings, created_at, updated_at "
            "FROM quizzes WHERE id = ? LIMIT 1;"
        )
        results = await d1_client.execute(sql, [str(quiz_id)])
        return results[0] if results else None

    @staticmethod
    async def get_by_join_code(join_code: str) -> dict[str, Any] | None:
        """Fetch quiz by public participation join code."""
        sql = (
            "SELECT id, owner_id, title, description, join_code, status, "
            "question_count, time_limit_seconds, settings, created_at, updated_at "
            "FROM quizzes WHERE upper(join_code) = upper(?) LIMIT 1;"
        )
        results = await d1_client.execute(sql, [join_code.strip()])
        return results[0] if results else None

    @staticmethod
    async def create_quiz(quiz_data: dict[str, Any]) -> dict[str, Any]:
        """Insert a new quiz into Cloudflare D1."""
        sql = (
            "INSERT INTO quizzes (id, owner_id, title, description, join_code, "
            "status, question_count, time_limit_seconds, settings, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);"
        )
        params = [
            quiz_data["id"],
            quiz_data["owner_id"],
            quiz_data["title"],
            quiz_data.get("description"),
            quiz_data["join_code"],
            quiz_data.get("status", "draft"),
            quiz_data.get("question_count", 0),
            quiz_data.get("time_limit_seconds"),
            quiz_data.get("settings", "{}"),
            quiz_data["created_at"],
            quiz_data["updated_at"],
        ]
        await d1_client.execute(sql, params)
        return quiz_data

    @staticmethod
    async def update_quiz(quiz_id: str, updates: dict[str, Any]) -> bool:
        """Update quiz fields."""
        fields = []
        params = []
        for k, v in updates.items():
            fields.append(f"{k} = ?")
            params.append(v)
        fields.append("updated_at = datetime('now')")
        params.append(str(quiz_id))

        sql = f"UPDATE quizzes SET {', '.join(fields)} WHERE id = ?;"
        await d1_client.execute(sql, params)
        return True

    @staticmethod
    async def get_quiz_leaderboard(quiz_id: str, limit: int = 100) -> list[dict[str, Any]]:
        """Fetch ranked leaderboard for a quiz."""
        sql = (
            "SELECT id, quiz_id, participant_name, score, max_score, "
            "correct_count, incorrect_count, completion_status, started_at, "
            "completed_at, duration_seconds "
            "FROM quiz_attempts WHERE quiz_id = ? AND completion_status = 'completed' "
            "ORDER BY score DESC, duration_seconds ASC, completed_at ASC LIMIT ?;"
        )
        return await d1_client.execute(sql, [str(quiz_id), limit])
