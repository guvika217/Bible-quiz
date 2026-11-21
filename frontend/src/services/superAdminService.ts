import { apiClient } from "./apiClient";
import type { User } from "@/types/auth";

export interface SystemStats {
  total_admins: number;
  total_super_admins: number;
  total_quizzes: number;
  total_questions: number;
  total_attempts: number;
}

export const superAdminService = {
  getSystemStats: (): Promise<SystemStats> => {
    return apiClient.get<SystemStats>("/superadmin/stats");
  },

  listUsers: (): Promise<User[]> => {
    return apiClient.get<User[]>("/superadmin/users");
  },

  updateUserRole: (userId: string, role: "ADMIN" | "SUPER_ADMIN"): Promise<{ message: string }> => {
    return apiClient.request<{ message: string }>(`/superadmin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  updateAccountStatus: (
    userId: string,
    account_status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  ): Promise<{ message: string }> => {
    return apiClient.request<{ message: string }>(`/superadmin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ account_status }),
    });
  },
};
