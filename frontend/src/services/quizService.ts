import { apiClient } from "./apiClient";
import type { Quiz, QuizCreateInput, QuizPerformanceAnalytics } from "@/types/quiz";

export const quizService = {
  /**
   * List all quizzes
   */
  listQuizzes: (): Promise<Quiz[]> => {
    return apiClient.get<Quiz[]>("/quizzes");
  },

  /**
   * Create a new quiz
   */
  createQuiz: (input: QuizCreateInput): Promise<Quiz> => {
    return apiClient.post<Quiz>("/quizzes", input);
  },

  /**
   * Get leaderboard and player performance metrics for a specific quiz
   */
  getPerformanceAnalytics: (quizId: string): Promise<QuizPerformanceAnalytics> => {
    return apiClient.get<QuizPerformanceAnalytics>(`/quizzes/${quizId}/performance`);
  },
};
