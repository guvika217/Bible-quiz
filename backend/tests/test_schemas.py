"""Test suite validating all Pydantic schemas."""

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.answer import AnswerSubmit
from app.schemas.attempt import (
    AttemptJoin,
    AttemptResultResponse,
    CompletionStatus,
)
from app.schemas.question import (
    AdminQuestionResponse,
    ParticipantQuestionResponse,
    QuestionCreate,
    QuestionType,
)
from app.schemas.quiz import (
    QuizCreate,
    QuizResponse,
    QuizStatus,
)
from app.schemas.user import (
    UserCreate,
    UserResponse,
)

# --- 1. USER SCHEMAS TESTS ---

def test_user_create_valid():
    user = UserCreate(name="Admin User", email="admin@example.com", password="SecurePassword123")
    assert user.name == "Admin User"
    assert user.email == "admin@example.com"
    assert user.password == "SecurePassword123"


def test_user_create_invalid_email():
    with pytest.raises(ValidationError):
        UserCreate(name="Admin", email="not-an-email", password="SecurePassword123")


def test_user_response_security():
    uid = uuid4()
    now = datetime.now(UTC)
    resp = UserResponse(id=uid, name="Admin", email="admin@example.com", created_at=now, updated_at=now)
    data = resp.model_dump()
    assert "password_hash" not in data
    assert "password" not in data
    assert data["id"] == uid


# --- 2. QUIZ SCHEMAS TESTS ---

def test_quiz_create_valid():
    quiz = QuizCreate(
        title="Genesis Quiz",
        description="Bible trivia on Genesis",
        join_code="GEN123",
        time_limit_seconds=300,
        settings={"shuffle": True},
    )
    assert quiz.title == "Genesis Quiz"
    assert quiz.join_code == "GEN123"


def test_quiz_create_invalid_time_limit():
    with pytest.raises(ValidationError):
        QuizCreate(title="Test", time_limit_seconds=0)  # must be gt 0


def test_quiz_create_empty_title():
    with pytest.raises(ValidationError):
        QuizCreate(title="   ")


def test_quiz_status_enum():
    uid = uuid4()
    now = datetime.now(UTC)
    resp = QuizResponse(
        id=uid,
        owner_id=uid,
        title="Test Quiz",
        join_code="TEST1",
        status=QuizStatus.ACTIVE,
        question_count=5,
        created_at=now,
        updated_at=now,
    )
    assert resp.status == QuizStatus.ACTIVE


# --- 3. QUESTION SCHEMAS TESTS ---

def test_question_create_single_choice():
    qid = uuid4()
    q = QuestionCreate(
        quiz_id=qid,
        question_text="Who was the oldest man in the Bible?",
        question_type=QuestionType.SINGLE_CHOICE,
        options=["Methuselah", "Noah", "Enoch", "Adam"],
        correct_answer="Methuselah",
        points=1,
        order_index=1,
    )
    assert q.correct_answer == "Methuselah"


def test_question_create_invalid_correct_answer():
    qid = uuid4()
    with pytest.raises(ValidationError):
        QuestionCreate(
            quiz_id=qid,
            question_text="Who was the oldest man?",
            question_type=QuestionType.SINGLE_CHOICE,
            options=["Noah", "Adam"],
            correct_answer="Methuselah",  # Not in options
            order_index=1,
        )


def test_participant_question_hides_correct_answer():
    qid = uuid4()
    pq = ParticipantQuestionResponse(
        id=qid,
        quiz_id=qid,
        question_text="Who built the ark?",
        question_type=QuestionType.SINGLE_CHOICE,
        options=["Noah", "Moses"],
        points=1,
        order_index=0,
    )
    data = pq.model_dump()
    assert "correct_answer" not in data
    assert "explanation" in data or data.get("explanation") is None


def test_admin_question_includes_correct_answer():
    qid = uuid4()
    now = datetime.now(UTC)
    aq = AdminQuestionResponse(
        id=qid,
        quiz_id=qid,
        question_text="Who built the ark?",
        question_type=QuestionType.SINGLE_CHOICE,
        options=["Noah", "Moses"],
        correct_answer="Noah",
        points=1,
        order_index=0,
        created_at=now,
        updated_at=now,
    )
    data = aq.model_dump()
    assert data["correct_answer"] == "Noah"


# --- 4. ATTEMPT SCHEMAS TESTS ---

def test_attempt_join_valid():
    join = AttemptJoin(join_code="gen123", participant_name="  David  ")
    assert join.join_code == "GEN123"  # Normalized to uppercase
    assert join.participant_name == "David"  # Whitespace stripped


def test_attempt_join_empty_name():
    with pytest.raises(ValidationError):
        AttemptJoin(join_code="GEN123", participant_name="   ")


def test_attempt_result_response_cannot_have_negative_scores():
    uid = uuid4()
    now = datetime.now(UTC)
    with pytest.raises(ValidationError):
        AttemptResultResponse(
            id=uid,
            quiz_id=uid,
            participant_name="David",
            completion_status=CompletionStatus.COMPLETED,
            started_at=now,
            score=-5,  # Invalid
            max_score=10,
            correct_count=0,
            incorrect_count=5,
        )


# --- 5. ANSWER SCHEMAS TESTS ---

def test_answer_submit_valid():
    att_id = uuid4()
    q_id = uuid4()
    sub = AnswerSubmit(
        attempt_id=att_id,
        question_id=q_id,
        selected_answer="Noah",
    )
    assert sub.selected_answer == "Noah"
    # Ensure participant submission model does NOT have scoring fields
    dump = sub.model_dump()
    assert "is_correct" not in dump
    assert "points_awarded" not in dump


def test_answer_submit_empty_answer():
    with pytest.raises(ValidationError):
        AnswerSubmit(attempt_id=uuid4(), question_id=uuid4(), selected_answer="   ")
