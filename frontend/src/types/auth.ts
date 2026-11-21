/**
 * User and Authentication Types with RBAC
 */

export type UserRole = "SUPER_ADMIN" | "ADMIN";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  email_verified: boolean;
  account_status: AccountStatus;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthStatusResponse {
  isAuthenticated: boolean;
  user: User | null;
}
