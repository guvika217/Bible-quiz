"""Leaderboard and Analytics schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class LeaderboardEntry(BaseModel):
    """Ranked participant attempt score entry."""

    rank: int = Field(ge=1, description="Leaderboard placement rank")
    attempt_id: UUID = Field(description="Attempt UUID")
    participant_name: str = Field(description="Participant display name")
    score: int = Field(ge=0, description="Total points scored (speed + accuracy weighted)")
    max_score: int = Field(ge=0, description="Total possible points")
    accuracy_percentage: float = Field(ge=0.0, le=100.0, description="Accuracy percentage")
    correct_count: int = Field(ge=0, description="Correct questions answered")
    incorrect_count: int = Field(ge=0, description="Incorrect questions answered")
    total_time_seconds: int = Field(ge=0, default=0, description="Total time taken in seconds")
    avg_time_seconds: float = Field(ge=0.0, default=0.0, description="Average response time per question")
    warning_count: int = Field(ge=0, default=0, description="Anti-cheat warnings received")
    completion_status: str = Field(default="completed")
    completed_at: datetime | None = Field(default=None, description="Completion timestamp")


class PerformanceBucket(BaseModel):
    """Score distribution bucket for histogram/graph."""

    range_label: str = Field(description="e.g. '0-20%', '21-40%', etc.")
    count: int = Field(ge=0, description="Number of participants in this score range")


class QuizPerformanceAnalytics(BaseModel):
    """Aggregated player performance analytics for a specific quiz."""

    quiz_id: UUID
    quiz_title: str
    total_participants: int = Field(ge=0)
    completed_participants: int = Field(ge=0)
    average_score: float = Field(ge=0.0)
    highest_score: int = Field(ge=0)
    average_accuracy: float = Field(ge=0.0)
    average_duration_seconds: float = Field(ge=0.0)
    score_distribution: list[PerformanceBucket] = Field(default_factory=list)
    top_leaderboard: list[LeaderboardEntry] = Field(default_factory=list)
