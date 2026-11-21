import { apiClient } from "./apiClient";
import type {
  AdminQuestion,
  AttemptResult,
  ParticipantAttemptSession,
  PublicQuizInfo,
  QuestionCreateInput,
  Quiz,
  QuizCreateInput,
  QuizPerformanceAnalytics,
} from "@/types/quiz";

export const quizService = {
  /**
   * List all quizzes
   */
  listQuizzes: (): Promise<Quiz[]> => {
    return apiClient.get<Quiz[]>("/quizzes");
  },

  /**
   * Get single quiz
   */
  getQuiz: (quizId: string): Promise<Quiz> => {
    return apiClient.get<Quiz>(`/quizzes/${quizId}`);
  },

  /**
   * Create a new quiz
   */
  createQuiz: (input: QuizCreateInput): Promise<Quiz> => {
    return apiClient.post<Quiz>("/quizzes", input);
  },

  /**
   * Update quiz (title, description, status, time limit)
   */
  updateQuiz: (quizId: string, updates: Partial<{ title: string; description: string; status: string; time_limit_seconds: number }>): Promise<Quiz> => {
    return apiClient.request<Quiz>(`/quizzes/${quizId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete quiz permanently
   */
  deleteQuiz: (quizId: string): Promise<{ message: string }> => {
    return apiClient.request<{ message: string }>(`/quizzes/${quizId}`, {
      method: "DELETE",
    });
  },

  /**
   * Get admin questions list
   */
  getAdminQuestions: (quizId: string): Promise<AdminQuestion[]> => {
    return apiClient.get<AdminQuestion[]>(`/quizzes/${quizId}/questions`);
  },

  /**
   * Add question to a quiz
   */
  addQuestion: (quizId: string, input: QuestionCreateInput): Promise<AdminQuestion> => {
    return apiClient.post<AdminQuestion>(`/quizzes/${quizId}/questions`, input);
  },

  /**
   * Delete question
   */
  deleteQuestion: (quizId: string, questionId: string): Promise<{ message: string }> => {
    return apiClient.request<{ message: string }>(`/quizzes/${quizId}/questions/${questionId}`, {
      method: "DELETE",
    });
  },

  /**
   * Public: Get quiz metadata before joining
   */
  getPublicQuizInfo: (joinCode: string): Promise<PublicQuizInfo> => {
    return apiClient.get<PublicQuizInfo>(`/quizzes/public/${joinCode}`);
  },

  /**
   * Public: Join quiz with participant name
   */
  joinQuiz: (joinCode: string, participantName: string): Promise<ParticipantAttemptSession> => {
    return apiClient.post<ParticipantAttemptSession>("/quizzes/public/join", {
      join_code: joinCode,
      participant_name: participantName,
    });
  },

  /**
   * Public: Submit answers with speed time and anti-cheat warning count
   */
  submitQuizAttempt: (
    attemptId: string,
    answers: Array<{ question_id: string; selected_answer: string; response_time_seconds: number }>,
    durationSeconds: number,
    warningCount: number = 0
  ): Promise<AttemptResult> => {
    return apiClient.post<AttemptResult>("/quizzes/public/submit", {
      attempt_id: attemptId,
      answers,
      duration_seconds: durationSeconds,
      warning_count: warningCount,
    });
  },

  /**
   * Get leaderboard and performance analytics
   */
  getPerformanceAnalytics: (quizId: string): Promise<QuizPerformanceAnalytics> => {
    return apiClient.get<QuizPerformanceAnalytics>(`/quizzes/${quizId}/performance`);
  },
};
