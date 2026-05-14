"use client";

import { createContext, useContext } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: AuthUser | null;
  token?: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string; errorCode?: string }>;
  register: (email: string, password: string, name: string) => Promise<{
    error?: string;
    email?: string;
    requiresVerification?: boolean;
    expiresInSeconds?: number;
    retryAfterSeconds?: number;
  }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({}),
  register: async () => ({}),
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
