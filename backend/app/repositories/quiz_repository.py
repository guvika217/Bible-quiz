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
    async def get_by_title(title: str) -> dict[str, Any] | None:
        """Fetch quiz by exact case-insensitive title."""
        sql = (
            "SELECT id, owner_id, title, description, join_code, status, "
            "question_count, time_limit_seconds, settings, created_at, updated_at "
            "FROM quizzes WHERE lower(trim(title)) = lower(trim(?)) LIMIT 1;"
        )
        results = await d1_client.execute(sql, [title.strip()])
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
    async def update_quiz(quiz_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        """Update an existing quiz fields in Cloudflare D1."""
        if not updates:
            return await QuizRepository.get_by_id(quiz_id)

        set_clauses = []
        params = []
        for key, value in updates.items():
            set_clauses.append(f"{key} = ?")
            params.append(value)

        params.append(str(quiz_id))
        sql = f"UPDATE quizzes SET {', '.join(set_clauses)} WHERE id = ?;"
        await d1_client.execute(sql, params)
        return await QuizRepository.get_by_id(quiz_id)

    @staticmethod
    async def delete_quiz(quiz_id: str) -> bool:
        """Delete a quiz and its questions & attempts from Cloudflare D1."""
        await d1_client.execute("DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM quiz_attempts WHERE quiz_id = ?);", [str(quiz_id)])
        await d1_client.execute("DELETE FROM quiz_attempts WHERE quiz_id = ?;", [str(quiz_id)])
        await d1_client.execute("DELETE FROM questions WHERE quiz_id = ?;", [str(quiz_id)])
        await d1_client.execute("DELETE FROM quizzes WHERE id = ?;", [str(quiz_id)])
        return True

    @staticmethod
    async def get_quiz_leaderboard(quiz_id: str, limit: int = 100) -> list[dict[str, Any]]:
        """Fetch ranked leaderboard for a quiz sorted by highest score, then fastest duration."""
        sql = (
            "SELECT id, quiz_id, participant_name, score, max_score, "
            "correct_count, incorrect_count, completion_status, started_at, "
            "completed_at, duration_seconds, total_time_seconds, avg_time_seconds, warning_count "
            "FROM quiz_attempts WHERE quiz_id = ? AND completion_status IN ('completed', 'disqualified') "
            "ORDER BY "
            "CASE WHEN completion_status = 'disqualified' THEN 1 ELSE 0 END ASC, "
            "score DESC, total_time_seconds ASC, avg_time_seconds ASC, completed_at ASC LIMIT ?;"
        )
        return await d1_client.execute(sql, [str(quiz_id), limit])
