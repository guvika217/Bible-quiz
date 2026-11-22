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
from app.schemas.quiz import QuizCreate, QuizResponse, QuizUpdate
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
        trimmed_title = quiz_in.title.strip()
        existing = await QuizRepository.get_by_title(trimmed_title)
        if existing:
            raise AppException(f"A quiz with the name '{trimmed_title}' already exists. Please choose a unique name.", status_code=400)

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

    @staticmethod
    async def update_quiz(quiz_id: UUID, quiz_up: QuizUpdate) -> QuizResponse:
        quiz = await QuizRepository.get_by_id(str(quiz_id))
        if not quiz:
            raise AppException("Quiz not found", status_code=404)

        now = datetime.now(UTC).isoformat()
        updates: dict[str, Any] = {"updated_at": now}

        if quiz_up.title is not None:
            trimmed = quiz_up.title.strip()
            existing = await QuizRepository.get_by_title(trimmed)
            if existing and existing["id"] != str(quiz_id):
                raise AppException(f"A quiz with the name '{trimmed}' already exists.", status_code=400)
            updates["title"] = trimmed

        if quiz_up.description is not None:
            updates["description"] = quiz_up.description.strip()

        if quiz_up.status is not None:
            updates["status"] = quiz_up.status.value

        if quiz_up.time_limit_seconds is not None:
            updates["time_limit_seconds"] = quiz_up.time_limit_seconds

        if quiz_up.settings is not None:
            updates["settings"] = json.dumps(quiz_up.settings)

        updated_record = await QuizRepository.update_quiz(str(quiz_id), updates)
        if not updated_record:
            raise AppException("Failed to update quiz", status_code=500)

        settings_dict = {}
        if updated_record.get("settings"):
            if isinstance(updated_record["settings"], str):
                try:
                    settings_dict = json.loads(updated_record["settings"])
                except (json.JSONDecodeError, TypeError):
                    settings_dict = {}
            elif isinstance(updated_record["settings"], dict):
                settings_dict = updated_record["settings"]

        return QuizResponse(
            id=UUID(updated_record["id"]),
            owner_id=UUID(updated_record["owner_id"]),
            title=updated_record["title"],
            description=updated_record.get("description"),
            join_code=updated_record["join_code"],
            status=updated_record["status"],
            question_count=updated_record.get("question_count", 0),
            time_limit_seconds=updated_record.get("time_limit_seconds"),
            settings=settings_dict,
            created_at=updated_record["created_at"],
            updated_at=updated_record["updated_at"],
        )

    @staticmethod
    async def delete_quiz(quiz_id: UUID) -> bool:
        quiz = await QuizRepository.get_by_id(str(quiz_id))
        if not quiz:
            raise AppException("Quiz not found", status_code=404)
        return await QuizRepository.delete_quiz(str(quiz_id))

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

    # --- PUBLIC PARTICIPANT PLAY FLOW WITH SPEED + ACCURACY SCORING ---

    @staticmethod
    async def get_public_quiz_info(join_code: str) -> dict[str, Any]:
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
    async def join_quiz(join_input: AttemptJoin, client_ip: str | None = None) -> dict[str, Any]:
        quiz = await QuizRepository.get_by_join_code(join_input.join_code)
        if not quiz:
            raise AppException("Quiz not found with this join code", status_code=404)

        # 1 IP per quiz restriction
        if client_ip and client_ip not in ("127.0.0.1", "::1", "localhost", "testclient"):
            has_attempted = await AttemptRepository.has_ip_attempted(quiz["id"], client_ip)
            if has_attempted:
                raise AppException(
                    "You have already participated in this quiz from this device / IP address. Multiple entries are not permitted.",
                    status_code=400,
                )

        now = datetime.now(UTC).isoformat()
        attempt_id = uuid4()

        q_records = await QuestionRepository.get_quiz_questions_for_participant(quiz["id"])
        participant_questions: list[ParticipantQuestionResponse] = []
        max_possible_score = 0

        for r in q_records:
            opts = json.loads(r["options"]) if isinstance(r["options"], str) else r["options"]
            pts = r.get("points", 1)
            # Base accuracy points (1000 base pts per question)
            max_possible_score += (pts * 1000)
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
            "ip_address": client_ip,
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
        """Evaluate submitted answers with Kahoot-style speed + accuracy algorithm.

        Score per correct question = Base Points (1000) * (1 - (response_time / (2 * time_limit)))
        Faster answer = Higher score. Incorrect answer = 0 points.
        If warning_count >= 3 (tab switching / cheating), participant is marked 'disqualified'.
        """
        attempt = await AttemptRepository.get_attempt_by_id(str(submission.attempt_id))
        if not attempt:
            raise AppException("Attempt session not found", status_code=404)

        if attempt["completion_status"] in ("completed", "disqualified"):
            raise AppException("This attempt has already been submitted and finalized", status_code=400)

        admin_questions = await QuestionRepository.get_quiz_questions_for_admin(attempt["quiz_id"])
        q_map = {str(q["id"]): q for q in admin_questions}
        quiz = await QuizRepository.get_by_id(attempt["quiz_id"])
        q_time_limit = (quiz.get("time_limit_seconds") or 30) if quiz else 30

        total_score = 0
        correct_count = 0
        incorrect_count = 0
        max_possible_score = sum((q.get("points", 1) * 1000) for q in admin_questions)
        response_times: list[float] = []
        now = datetime.now(UTC).isoformat()

        # Check anti-cheat disqualification threshold (>= 3 warnings)
        is_disqualified = submission.warning_count >= 3
        status_to_set = "disqualified" if is_disqualified else "completed"

        answers_to_insert: list[dict[str, Any]] = []

        for ans in submission.answers:
            q_id_str = str(ans.question_id)
            resp_time = float(ans.response_time_seconds)
            response_times.append(resp_time)

            if q_id_str in q_map:
                target_q = q_map[q_id_str]
                is_correct = (ans.selected_answer.strip().lower() == target_q["correct_answer"].strip().lower())
                base_points = target_q.get("points", 1) * 1000

                # Speed score calculation:
                # If answered in 0s -> 1000 pts. If answered at deadline -> 500 pts.
                # If incorrect or disqualified -> 0 pts.
                if is_correct and not is_disqualified:
                    speed_factor = max(0.5, 1.0 - (resp_time / (2.0 * float(q_time_limit))))
                    pts_awarded = round(base_points * speed_factor)
                    total_score += pts_awarded
                    correct_count += 1
                else:
                    pts_awarded = 0
                    if not is_correct:
                        incorrect_count += 1

                answers_to_insert.append({
                    "id": str(uuid4()),
                    "attempt_id": str(submission.attempt_id),
                    "question_id": q_id_str,
                    "selected_answer": ans.selected_answer,
                    "is_correct": is_correct,
                    "points_awarded": pts_awarded,
                    "response_time_seconds": resp_time,
                    "answered_at": now,
                })

        total_time = submission.duration_seconds
        avg_time = round(sum(response_times) / len(response_times), 2) if response_times else 0.0

        # Execute answer recording and attempt completion in parallel / single batch
        if answers_to_insert:
            await AttemptRepository.record_answers_batch(answers_to_insert)

        await AttemptRepository.complete_attempt(
            attempt_id=str(submission.attempt_id),
            score=total_score,
            max_score=max_possible_score,
            correct_count=correct_count,
            incorrect_count=incorrect_count,
            total_time_seconds=total_time,
            avg_time_seconds=avg_time,
            warning_count=submission.warning_count,
            completion_status=status_to_set,
            completed_at=now,
        )

        return AttemptResultResponse(
            id=UUID(attempt["id"]),
            quiz_id=UUID(attempt["quiz_id"]),
            participant_name=attempt["participant_name"],
            completion_status=status_to_set,
            started_at=attempt["started_at"],
            score=total_score,
            max_score=max_possible_score,
            correct_count=correct_count,
            incorrect_count=incorrect_count,
            duration_seconds=total_time,
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
            duration = att.get("total_time_seconds") or att.get("duration_seconds") or 0
            avg_time = float(att.get("avg_time_seconds") or 0.0)
            warnings = att.get("warning_count") or 0

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
                    total_time_seconds=duration,
                    avg_time_seconds=avg_time,
                    warning_count=warnings,
                    completion_status=att.get("completion_status", "completed"),
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
