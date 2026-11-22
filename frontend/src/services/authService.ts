import { apiClient } from "./apiClient";
import type { LoginCredentials, User } from "@/types/auth";

export const authService = {
  /**
   * Admin Login endpoint. Sets HttpOnly cookie on backend and persists token locally for cross-domain support.
   */
  login: async (credentials: LoginCredentials): Promise<User> => {
    const user = await apiClient.post<User>("/auth/login", credentials);
    if (typeof window !== "undefined") {
      if (user.access_token) {
        localStorage.setItem("admin_access_token", user.access_token);
        // Also set document.cookie so Next.js middleware detects it on the same domain
        document.cookie = `admin_access_token=${user.access_token}; path=/; max-age=86400; SameSite=Lax`;
      }
    }
    return user;
  },

  /**
   * Admin Logout endpoint. Clears HttpOnly cookie and local storage token.
   */
  logout: async (): Promise<{ message: string }> => {
    try {
      return await apiClient.post<{ message: string }>("/auth/logout");
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_access_token");
        document.cookie = "admin_access_token=; path=/; max-age=0;";
      }
    }
  },

  /**
   * Retrieves the current authenticated admin profile.
   */
  getCurrentUser: (): Promise<User> => {
    return apiClient.get<User>("/auth/me");
  },
};
