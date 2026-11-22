-- Migration 0004: Add IP address column to quiz_attempts to prevent duplicate entries per IP
ALTER TABLE quiz_attempts ADD COLUMN ip_address TEXT NULL;
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_ip ON quiz_attempts(quiz_id, ip_address);
