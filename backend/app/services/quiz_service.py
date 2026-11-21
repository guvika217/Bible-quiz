"""Quiz and Leaderboard analytics service."""

import json
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from app.core.exceptions import AppException
from app.repositories.attempt_repository import AttemptRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.quiz_repository import QuizRepository
from app.schemas.attempt import AttemptJoin, AttemptResponse, AttemptResultResponse
from app.schemas.leaderboard import (
    LeaderboardEntry,
    PerformanceBucket,
    QuizPerformanceAnalytics,
)
from app.schemas.question import (
    AdminQuestionResponse,
    ParticipantQuestionResponse,
    QuestionCreate,
)
from app.schemas.quiz import QuizCreate, QuizResponse
from app.schemas.submission import AttemptSubmission


class QuizService:
    """Business logic for Quiz management, leaderboards, questions, and participant play sessions."""

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
    async def get_quiz(quiz_id: UUID) -> QuizResponse:
        r = await QuizRepository.get_by_id(str(quiz_id))
        if not r:
            raise AppException("Quiz not found", status_code=404)

        settings_dict = {}
        if r.get("settings"):
            if isinstance(r["settings"], str):
                try:
                    settings_dict = json.loads(r["settings"])
                except (json.JSONDecodeError, TypeError):
                    settings_dict = {}
            elif isinstance(r["settings"], dict):
                settings_dict = r["settings"]

        return QuizResponse(
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
            "time_limit_seconds": quiz_in.time_limit_seconds or 30,
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
            time_limit_seconds=data["time_limit_seconds"],
            settings=quiz_in.settings,
            created_at=now,
            updated_at=now,
        )

    # --- QUESTION MANAGEMENT ---

    @staticmethod
    async def add_question(quiz_id: UUID, q_in: QuestionCreate) -> AdminQuestionResponse:
        quiz = await QuizRepository.get_by_id(str(quiz_id))
        if not quiz:
            raise AppException("Quiz not found", status_code=404)

        now = datetime.now(UTC).isoformat()
        q_id = uuid4()

        data = {
            "id": str(q_id),
            "quiz_id": str(quiz_id),
            "question_text": q_in.question_text,
            "question_type": q_in.question_type.value,
            "options": json.dumps(q_in.options),
            "correct_answer": q_in.correct_answer,
            "explanation": q_in.explanation,
            "points": q_in.points,
            "order_index": q_in.order_index,
            "created_at": now,
            "updated_at": now,
        }
        await QuestionRepository.create_question(data)

        return AdminQuestionResponse(
            id=q_id,
            quiz_id=quiz_id,
            question_text=q_in.question_text,
            question_type=q_in.question_type,
            options=q_in.options,
            correct_answer=q_in.correct_answer,
            explanation=q_in.explanation,
            points=q_in.points,
            order_index=q_in.order_index,
            created_at=now,
            updated_at=now,
        )

    @staticmethod
    async def get_admin_questions(quiz_id: UUID) -> list[AdminQuestionResponse]:
        records = await QuestionRepository.get_quiz_questions_for_admin(str(quiz_id))
        items: list[AdminQuestionResponse] = []
        for r in records:
            options_list = json.loads(r["options"]) if isinstance(r["options"], str) else r["options"]
            items.append(
                AdminQuestionResponse(
                    id=UUID(r["id"]),
                    quiz_id=UUID(r["quiz_id"]),
                    question_text=r["question_text"],
                    question_type=r["question_type"],
                    options=options_list,
                    correct_answer=r["correct_answer"],
                    explanation=r.get("explanation"),
                    points=r.get("points", 1),
                    order_index=r.get("order_index", 0),
                    created_at=r["created_at"],
                    updated_at=r["updated_at"],
                )
            )
        return items

    @staticmethod
    async def delete_question(quiz_id: UUID, question_id: UUID) -> bool:
        return await QuestionRepository.delete_question(str(question_id), str(quiz_id))

    # --- PUBLIC PARTICIPANT PLAY FLOW ---

    @staticmethod
    async def get_public_quiz_info(join_code: str) -> dict[str, Any]:
        """Fetch public quiz metadata for participant registration."""
        quiz = await QuizRepository.get_by_join_code(join_code)
        if not quiz:
            raise AppException("Invalid quiz code or quiz not found", status_code=404)

        return {
            "id": quiz["id"],
            "title": quiz["title"],
            "description": quiz.get("description"),
            "join_code": quiz["join_code"],
            "time_limit_seconds": quiz.get("time_limit_seconds"),
            "question_count": quiz.get("question_count", 0),
        }

    @staticmethod
    async def join_quiz(join_input: AttemptJoin) -> dict[str, Any]:
        """Participant enters name with join code to start an attempt session."""
        quiz = await QuizRepository.get_by_join_code(join_input.join_code)
        if not quiz:
            raise AppException("Quiz not found with this join code", status_code=404)

        now = datetime.now(UTC).isoformat()
        attempt_id = uuid4()

        q_records = await QuestionRepository.get_quiz_questions_for_participant(quiz["id"])
        participant_questions: list[ParticipantQuestionResponse] = []
        max_possible_score = 0

        for r in q_records:
            opts = json.loads(r["options"]) if isinstance(r["options"], str) else r["options"]
            pts = r.get("points", 1)
            max_possible_score += pts
            participant_questions.append(
                ParticipantQuestionResponse(
                    id=UUID(r["id"]),
                    quiz_id=UUID(r["quiz_id"]),
                    question_text=r["question_text"],
                    question_type=r["question_type"],
                    options=opts,
                    explanation=r.get("explanation"),
                    points=pts,
                    order_index=r.get("order_index", 0),
                )
            )

        attempt_data = {
            "id": str(attempt_id),
            "quiz_id": quiz["id"],
            "participant_name": join_input.participant_name,
            "score": 0,
            "max_score": max_possible_score,
            "correct_count": 0,
            "incorrect_count": 0,
            "completion_status": "in_progress",
            "started_at": now,
        }
        await AttemptRepository.create_attempt(attempt_data)

        return {
            "attempt": AttemptResponse(
                id=attempt_id,
                quiz_id=UUID(quiz["id"]),
                participant_name=join_input.participant_name,
                completion_status="in_progress",
                started_at=now,
            ),
            "quiz": {
                "id": quiz["id"],
                "title": quiz["title"],
                "description": quiz.get("description"),
                "time_limit_seconds": quiz.get("time_limit_seconds"),
            },
            "questions": participant_questions,
        }

    @staticmethod
    async def submit_attempt(submission: AttemptSubmission) -> AttemptResultResponse:
        """Evaluate submitted participant answers, compute score, and record to DB."""
        attempt = await AttemptRepository.get_attempt_by_id(str(submission.attempt_id))
        if not attempt:
            raise AppException("Attempt session not found", status_code=404)

        if attempt["completion_status"] == "completed":
            raise AppException("This attempt has already been submitted and finalized", status_code=400)

        admin_questions = await QuestionRepository.get_quiz_questions_for_admin(attempt["quiz_id"])
        q_map = {str(q["id"]): q for q in admin_questions}

        score = 0
        correct_count = 0
        incorrect_count = 0
        max_score = sum(q.get("points", 1) for q in admin_questions)
        now = datetime.now(UTC).isoformat()

        for ans in submission.answers:
            q_id_str = str(ans.question_id)
            if q_id_str in q_map:
                target_q = q_map[q_id_str]
                is_correct = ans.selected_answer.strip().lower() == target_q["correct_answer"].strip().lower()
                pts = target_q.get("points", 1) if is_correct else 0

                if is_correct:
                    score += pts
                    correct_count += 1
                else:
                    incorrect_count += 1

                await AttemptRepository.record_answer({
                    "id": str(uuid4()),
                    "attempt_id": str(submission.attempt_id),
                    "question_id": q_id_str,
                    "selected_answer": ans.selected_answer,
                    "is_correct": is_correct,
                    "points_awarded": pts,
                    "answered_at": now,
                })

        await AttemptRepository.complete_attempt(
            attempt_id=str(submission.attempt_id),
            score=score,
            max_score=max_score,
            correct_count=correct_count,
            incorrect_count=incorrect_count,
            duration_seconds=submission.duration_seconds,
            completed_at=now,
        )

        return AttemptResultResponse(
            id=UUID(attempt["id"]),
            quiz_id=UUID(attempt["quiz_id"]),
            participant_name=attempt["participant_name"],
            completion_status="completed",
            started_at=attempt["started_at"],
            score=score,
            max_score=max_score,
            correct_count=correct_count,
            incorrect_count=incorrect_count,
            duration_seconds=submission.duration_seconds,
            completed_at=now,
        )

    # --- LEADERBOARD & PERFORMANCE ---

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
