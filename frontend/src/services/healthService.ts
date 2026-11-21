import { apiClient } from "./apiClient";
import type { HealthCheckResponse, RootInfoResponse, SystemReadinessResponse } from "@/types/api";

export const healthService = {
  /**
   * Fetch current system health
   */
  getHealth: (): Promise<HealthCheckResponse> => {
    return apiClient.get<HealthCheckResponse>("/health");
  },

  /**
   * Fetch readiness probe state
   */
  getReadiness: (): Promise<SystemReadinessResponse> => {
    return apiClient.get<SystemReadinessResponse>("/health/ready");
  },

  /**
   * Fetch API V1 root details
   */
  getRootInfo: (): Promise<RootInfoResponse> => {
    return apiClient.get<RootInfoResponse>("");
  },
};
