/**
 * Quiz, Question, and Participant Types
 */

export interface Quiz {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  join_code: string;
  status: "draft" | "active" | "completed" | "archived";
  question_count: number;
  time_limit_seconds: number | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface QuizCreateInput {
  title: string;
  description?: string;
  join_code?: string;
  time_limit_seconds?: number;
  settings?: Record<string, unknown>;
}

export interface AdminQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: "single_choice" | "multiple_choice" | "true_false";
  options: string[];
  correct_answer: string;
  explanation: string | null;
  points: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ParticipantQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: "single_choice" | "multiple_choice" | "true_false";
  options: string[];
  explanation: string | null;
  points: number;
  order_index: number;
}

export interface QuestionCreateInput {
  quiz_id: string;
  question_text: string;
  question_type: "single_choice" | "multiple_choice" | "true_false";
  options: string[];
  correct_answer: string;
  explanation?: string;
  points?: number;
  order_index?: number;
}

export interface PublicQuizInfo {
  id: string;
  title: string;
  description: string | null;
  join_code: string;
  time_limit_seconds: number | null;
  question_count: number;
}

export interface ParticipantAttemptSession {
  attempt: {
    id: string;
    quiz_id: string;
    participant_name: string;
    completion_status: string;
    started_at: string;
  };
  quiz: {
    id: string;
    title: string;
    description: string | null;
    time_limit_seconds: number | null;
  };
  questions: ParticipantQuestion[];
}

export interface AttemptResult {
  id: string;
  quiz_id: string;
  participant_name: string;
  completion_status: string;
  started_at: string;
  score: number;
  max_score: number;
  correct_count: number;
  incorrect_count: number;
  duration_seconds: number;
  completed_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  attempt_id: string;
  participant_name: string;
  score: number;
  max_score: number;
  accuracy_percentage: number;
  correct_count: number;
  incorrect_count: number;
  duration_seconds: number | null;
  completed_at: string | null;
}

export interface PerformanceBucket {
  range_label: string;
  count: number;
}

export interface QuizPerformanceAnalytics {
  quiz_id: string;
  quiz_title: string;
  total_participants: number;
  completed_participants: number;
  average_score: number;
  highest_score: number;
  average_accuracy: number;
  average_duration_seconds: number;
  score_distribution: PerformanceBucket[];
  top_leaderboard: LeaderboardEntry[];
}
