"""Participant attempts and answers repository for Cloudflare D1."""

from typing import Any

from app.db.d1 import d1_client


class AttemptRepository:
    """Data access repository for quiz_attempts and attempt_answers."""

    @staticmethod
    async def create_attempt(data: dict[str, Any]) -> dict[str, Any]:
        """Create a participant quiz attempt."""
        sql = (
            "INSERT INTO quiz_attempts (id, quiz_id, participant_name, score, max_score, "
            "correct_count, incorrect_count, completion_status, started_at, total_time_seconds, "
            "avg_time_seconds, warning_count) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0.0, 0);"
        )
        params = [
            data["id"],
            data["quiz_id"],
            data["participant_name"],
            data.get("score", 0),
            data.get("max_score", 0),
            data.get("correct_count", 0),
            data.get("incorrect_count", 0),
            data.get("completion_status", "in_progress"),
            data["started_at"],
        ]
        await d1_client.execute(sql, params)
        return data

    @staticmethod
    async def get_attempt_by_id(attempt_id: str) -> dict[str, Any] | None:
        """Fetch attempt details by UUID."""
        sql = (
            "SELECT id, quiz_id, participant_name, score, max_score, "
            "correct_count, incorrect_count, completion_status, started_at, completed_at, "
            "duration_seconds, total_time_seconds, avg_time_seconds, warning_count "
            "FROM quiz_attempts WHERE id = ? LIMIT 1;"
        )
        results = await d1_client.execute(sql, [str(attempt_id)])
        return results[0] if results else None

    @staticmethod
    async def record_answer(answer_data: dict[str, Any]) -> dict[str, Any]:
        """Insert or replace submitted answer for attempt including response time."""
        sql = (
            "INSERT INTO attempt_answers (id, attempt_id, question_id, selected_answer, "
            "is_correct, points_awarded, response_time_seconds, answered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);"
        )
        params = [
            answer_data["id"],
            answer_data["attempt_id"],
            answer_data["question_id"],
            answer_data["selected_answer"],
            1 if answer_data.get("is_correct") else 0,
            answer_data.get("points_awarded", 0),
            answer_data.get("response_time_seconds", 0.0),
            answer_data["answered_at"],
        ]
        await d1_client.execute(sql, params)
        return answer_data

    @staticmethod
    async def complete_attempt(
        attempt_id: str,
        score: int,
        max_score: int,
        correct_count: int,
        incorrect_count: int,
        total_time_seconds: int,
        avg_time_seconds: float,
        warning_count: int,
        completion_status: str,
        completed_at: str,
    ) -> bool:
        """Update and finalize participant attempt with speed/accuracy scores and anti-cheat warnings."""
        sql = (
            "UPDATE quiz_attempts SET score = ?, max_score = ?, correct_count = ?, "
            "incorrect_count = ?, duration_seconds = ?, total_time_seconds = ?, "
            "avg_time_seconds = ?, warning_count = ?, completion_status = ?, "
            "completed_at = ? WHERE id = ?;"
        )
        params = [
            score,
            max_score,
            correct_count,
            incorrect_count,
            total_time_seconds,
            total_time_seconds,
            avg_time_seconds,
            warning_count,
            completion_status,
            completed_at,
            str(attempt_id),
        ]
        await d1_client.execute(sql, params)
        return True
