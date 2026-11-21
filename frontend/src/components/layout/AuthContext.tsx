"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authService } from "@/services/authService";
import type { User } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authService.getCurrentUser();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    authService
      .getCurrentUser()
      .then((data) => {
        if (isMounted) {
          setUser(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
