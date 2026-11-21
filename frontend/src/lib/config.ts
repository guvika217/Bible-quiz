/**
 * Frontend Environment Configuration
 */

export const env = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
  appName:
    process.env.NEXT_PUBLIC_APP_NAME || "Bible Quiz Platform",
  isProduction: process.env.NODE_ENV === "production",
} as const;
