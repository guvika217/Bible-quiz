"""Question repository for Cloudflare D1 data access."""

import json
from typing import Any

from app.db.d1 import d1_client


class QuestionRepository:
    """Data access repository for questions table."""

    @staticmethod
    async def create_question(data: dict[str, Any]) -> dict[str, Any]:
        """Insert a single question into a quiz."""
        sql = (
            "INSERT INTO questions (id, quiz_id, question_text, question_type, "
            "options, correct_answer, explanation, points, order_index, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);"
        )
        params = [
            data["id"],
            data["quiz_id"],
            data["question_text"],
            data.get("question_type", "single_choice"),
            data["options"] if isinstance(data["options"], str) else json.dumps(data["options"]),
            data["correct_answer"],
            data.get("explanation"),
            data.get("points", 1),
            data.get("order_index", 0),
            data["created_at"],
            data["updated_at"],
        ]
        await d1_client.execute(sql, params)

        # Update quiz question_count
        update_cnt_sql = (
            "UPDATE quizzes SET question_count = (SELECT COUNT(*) FROM questions WHERE quiz_id = ?), "
            "updated_at = datetime('now') WHERE id = ?;"
        )
        await d1_client.execute(update_cnt_sql, [data["quiz_id"], data["quiz_id"]])
        return data

    @staticmethod
    async def get_quiz_questions_for_admin(quiz_id: str) -> list[dict[str, Any]]:
        """Fetch all questions including correct answers and explanation for quiz author."""
        sql = (
            "SELECT id, quiz_id, question_text, question_type, options, correct_answer, "
            "explanation, points, order_index, created_at, updated_at "
            "FROM questions WHERE quiz_id = ? ORDER BY order_index ASC, created_at ASC;"
        )
        return await d1_client.execute(sql, [str(quiz_id)])

    @staticmethod
    async def get_quiz_questions_for_participant(quiz_id: str) -> list[dict[str, Any]]:
        """Fetch all questions without correct_answer for participant quiz sessions."""
        sql = (
            "SELECT id, quiz_id, question_text, question_type, options, explanation, "
            "points, order_index "
            "FROM questions WHERE quiz_id = ? ORDER BY order_index ASC, created_at ASC;"
        )
        return await d1_client.execute(sql, [str(quiz_id)])

    @staticmethod
    async def delete_question(question_id: str, quiz_id: str) -> bool:
        """Delete a question and decrement quiz count."""
        sql = "DELETE FROM questions WHERE id = ? AND quiz_id = ?;"
        await d1_client.execute(sql, [str(question_id), str(quiz_id)])
        update_cnt_sql = (
            "UPDATE quizzes SET question_count = (SELECT COUNT(*) FROM questions WHERE quiz_id = ?), "
            "updated_at = datetime('now') WHERE id = ?;"
        )
        await d1_client.execute(update_cnt_sql, [str(quiz_id), str(quiz_id)])
        return True
