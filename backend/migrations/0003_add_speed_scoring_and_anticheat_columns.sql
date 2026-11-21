-- Migration: 0003_add_speed_scoring_and_anticheat_columns.sql
-- Description: Adds total_time_seconds, avg_time_seconds, and warning_count to quiz_attempts,
-- plus response_time_seconds to attempt_answers for speed+accuracy calculation.

ALTER TABLE quiz_attempts ADD COLUMN total_time_seconds INTEGER DEFAULT 0;
ALTER TABLE quiz_attempts ADD COLUMN avg_time_seconds REAL DEFAULT 0.0;
ALTER TABLE quiz_attempts ADD COLUMN warning_count INTEGER DEFAULT 0;
ALTER TABLE attempt_answers ADD COLUMN response_time_seconds REAL DEFAULT 0.0;
