import { env } from "@/lib/config";
import type { ApiError } from "@/types/api";

export class ApiClientError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...restOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const mergedHeaders = new Headers(headers);
    if (!mergedHeaders.has("Content-Type") && !(restOptions.body instanceof FormData)) {
      mergedHeaders.set("Content-Type", "application/json");
    }
    if (!mergedHeaders.has("Accept")) {
      mergedHeaders.set("Accept", "application/json");
    }

    // Attach Bearer token from localStorage for seamless cross-domain auth between Vercel and Render
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("admin_access_token");
      if (storedToken && !mergedHeaders.has("Authorization")) {
        mergedHeaders.set("Authorization", `Bearer ${storedToken}`);
      }
    }

    try {
      const response = await fetch(url, {
        headers: mergedHeaders,
        credentials: "include", // Supports cross-origin or same-origin session cookies
        ...restOptions,
      });

      if (!response.ok) {
        let errorData: Partial<ApiError> = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        throw new ApiClientError(
          errorData.message || `Request failed with status ${response.status}`,
          response.status,
          errorData.details
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError(
        error instanceof Error ? error.message : "Network error occurred",
        0
      );
    }
  }

  get<T>(endpoint: string, options?: Omit<RequestOptions, "body" | "method">): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<RequestOptions, "body" | "method">
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const apiClient = new ApiClient(env.apiBaseUrl);
