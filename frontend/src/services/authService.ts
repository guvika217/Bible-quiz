import { apiClient } from "./apiClient";
import type { LoginCredentials, User } from "@/types/auth";

export const authService = {
  /**
   * Admin Login endpoint. Sets HttpOnly cookie on backend.
   */
  login: (credentials: LoginCredentials): Promise<User> => {
    return apiClient.post<User>("/auth/login", credentials);
  },

  /**
   * Admin Logout endpoint. Clears HttpOnly cookie.
   */
  logout: (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>("/auth/logout");
  },

  /**
   * Retrieves the current authenticated admin profile.
   */
  getCurrentUser: (): Promise<User> => {
    return apiClient.get<User>("/auth/me");
  },
};
