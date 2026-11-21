"""Quiz and Leaderboard analytics service."""

import json
from datetime import UTC, datetime
from uuid import UUID, uuid4

from app.core.exceptions import AppException
from app.repositories.quiz_repository import QuizRepository
from app.schemas.leaderboard import (
    LeaderboardEntry,
    PerformanceBucket,
    QuizPerformanceAnalytics,
)
from app.schemas.quiz import QuizCreate, QuizResponse


class QuizService:
    """Business logic for Quiz management, leaderboards, and performance analytics."""

    @staticmethod
    async def list_quizzes() -> list[QuizResponse]:
        records = await QuizRepository.list_quizzes()
        items: list[QuizResponse] = []
        for r in records:
            settings_dict = {}
            if r.get("settings"):
                if isinstance(r["settings"], str):
                    try:
                        settings_dict = json.loads(r["settings"])
                    except (json.JSONDecodeError, TypeError):
                        settings_dict = {}
                elif isinstance(r["settings"], dict):
                    settings_dict = r["settings"]

            items.append(
                QuizResponse(
                    id=UUID(r["id"]),
                    owner_id=UUID(r["owner_id"]),
                    title=r["title"],
                    description=r.get("description"),
                    join_code=r["join_code"],
                    status=r["status"],
                    question_count=r.get("question_count", 0),
                    time_limit_seconds=r.get("time_limit_seconds"),
                    settings=settings_dict,
                    created_at=r["created_at"],
                    updated_at=r["updated_at"],
                )
            )
        return items

    @staticmethod
    async def create_quiz(quiz_in: QuizCreate, owner_id: UUID) -> QuizResponse:
        now = datetime.now(UTC).isoformat()
        quiz_id = uuid4()
        join_code = quiz_in.join_code or f"BQ{str(uuid4())[:6].upper()}"

        data = {
            "id": str(quiz_id),
            "owner_id": str(owner_id),
            "title": quiz_in.title,
            "description": quiz_in.description,
            "join_code": join_code,
            "status": "draft",
            "question_count": 0,
            "time_limit_seconds": quiz_in.time_limit_seconds,
            "settings": json.dumps(quiz_in.settings),
            "created_at": now,
            "updated_at": now,
        }
        await QuizRepository.create_quiz(data)
        return QuizResponse(
            id=quiz_id,
            owner_id=owner_id,
            title=quiz_in.title,
            description=quiz_in.description,
            join_code=join_code,
            status="draft",
            question_count=0,
            time_limit_seconds=quiz_in.time_limit_seconds,
            settings=quiz_in.settings,
            created_at=now,
            updated_at=now,
        )

    @staticmethod
    async def get_performance_analytics(quiz_id: UUID) -> QuizPerformanceAnalytics:
        quiz = await QuizRepository.get_by_id(str(quiz_id))
        if not quiz:
            raise AppException("Quiz not found", status_code=404)

        attempts = await QuizRepository.get_quiz_leaderboard(str(quiz_id))

        total_participants = len(attempts)
        completed_participants = total_participants

        if total_participants == 0:
            return QuizPerformanceAnalytics(
                quiz_id=quiz_id,
                quiz_title=quiz["title"],
                total_participants=0,
                completed_participants=0,
                average_score=0.0,
                highest_score=0,
                average_accuracy=0.0,
                average_duration_seconds=0.0,
                score_distribution=[
                    PerformanceBucket(range_label="0-20%", count=0),
                    PerformanceBucket(range_label="21-40%", count=0),
                    PerformanceBucket(range_label="41-60%", count=0),
                    PerformanceBucket(range_label="61-80%", count=0),
                    PerformanceBucket(range_label="81-100%", count=0),
                ],
                top_leaderboard=[],
            )

        leaderboard: list[LeaderboardEntry] = []
        scores: list[int] = []
        accuracies: list[float] = []
        durations: list[float] = []

        bucket_counts = {"0-20%": 0, "21-40%": 0, "41-60%": 0, "61-80%": 0, "81-100%": 0}

        for idx, att in enumerate(attempts, 1):
            score = att.get("score", 0)
            max_score = att.get("max_score", 1) or 1
            accuracy = round((score / max_score) * 100.0, 1) if max_score > 0 else 0.0
            duration = att.get("duration_seconds") or 0

            scores.append(score)
            accuracies.append(accuracy)
            durations.append(float(duration))

            if accuracy <= 20:
                bucket_counts["0-20%"] += 1
            elif accuracy <= 40:
                bucket_counts["21-40%"] += 1
            elif accuracy <= 60:
                bucket_counts["41-60%"] += 1
            elif accuracy <= 80:
                bucket_counts["61-80%"] += 1
            else:
                bucket_counts["81-100%"] += 1

            leaderboard.append(
                LeaderboardEntry(
                    rank=idx,
                    attempt_id=UUID(att["id"]),
                    participant_name=att["participant_name"],
                    score=score,
                    max_score=max_score,
                    accuracy_percentage=accuracy,
                    correct_count=att.get("correct_count", 0),
                    incorrect_count=att.get("incorrect_count", 0),
                    duration_seconds=duration,
                    completed_at=att.get("completed_at"),
                )
            )

        distribution = [
            PerformanceBucket(range_label=k, count=v) for k, v in bucket_counts.items()
        ]

        avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
        max_score_val = max(scores) if scores else 0
        avg_accuracy = round(sum(accuracies) / len(accuracies), 1) if accuracies else 0.0
        avg_dur = round(sum(durations) / len(durations), 1) if durations else 0.0

        return QuizPerformanceAnalytics(
            quiz_id=quiz_id,
            quiz_title=quiz["title"],
            total_participants=total_participants,
            completed_participants=completed_participants,
            average_score=avg_score,
            highest_score=max_score_val,
            average_accuracy=avg_accuracy,
            average_duration_seconds=avg_dur,
            score_distribution=distribution,
            top_leaderboard=leaderboard,
        )
