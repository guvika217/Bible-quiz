/**
 * User and Authentication Types
 */

export interface User {
  id: string;
  name: string;
  email: string;
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
