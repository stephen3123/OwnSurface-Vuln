"use client";

import { useCallback, type ReactNode } from "react";
import { AuthContext } from "./auth";
import { api } from "./api-client";
import { clearPersistedAppState, clearReadableCookies } from "./browser-storage";
import { mutateSession, resetDashboardCache, useSession } from "./dashboard-cache";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useSession();
  const user = data ?? null;

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    if (res.error) return { error: res.error, errorCode: res.errorCode };
    if (res.data) {
      await mutateSession({
        id: res.data.user.id,
        email: res.data.user.email,
        name: res.data.user.name || "",
      });
      return {};
    }
    return { error: "Unexpected error" };
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await api.register(email, password, name);
    if (res.error) return { error: res.error };
    if (res.data) {
      return {
        email,
        requiresVerification: true,
        expiresInSeconds: res.data.expires_in_seconds,
        retryAfterSeconds: res.data.retry_after_seconds,
      };
    }
    return { error: "Unexpected error" };
  }, []);

  const logout = useCallback(async () => {
    // Clear the server session first so the HTTP-only cookie is removed.
    await api.logout().catch(() => {});
    api.abortAllRequests();
    clearPersistedAppState();
    clearReadableCookies();
    await resetDashboardCache();
    await mutateSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
