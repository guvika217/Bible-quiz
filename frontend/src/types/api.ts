/**
 * Common API Types
 */

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  status_code: number;
  details?: unknown;
}

export interface HealthCheckResponse {
  status: string;
  environment: string;
  version: string;
  timestamp: string;
}

export interface SystemReadinessResponse {
  status: string;
  subsystems: Record<string, string>;
  timestamp: string;
}

export interface RootInfoResponse {
  name: string;
  version: string;
  docs_url: string;
  api_v1: string;
  status: string;
}
