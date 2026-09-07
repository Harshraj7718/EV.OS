"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiClient } from "@/lib/api-client";
import { tokenStorage } from "@/lib/auth/token-storage";
import type { AuthUser, TokenPair } from "@/lib/auth/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface TokenPairResponse extends TokenPair {
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!tokenStorage.getAccessToken()) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }
      try {
        const me = await apiClient.get<AuthUser>("/api/auth/me");
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        tokenStorage.clear();
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiClient.post<TokenPairResponse>(
      "/api/auth/login",
      { email, password },
      { skipAuth: true },
    );
    tokenStorage.setTokens(result.access_token, result.refresh_token);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await apiClient.post<TokenPairResponse>("/api/auth/register", payload, {
      skipAuth: true,
    });
    tokenStorage.setTokens(result.access_token, result.refresh_token);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post(
          "/api/auth/logout",
          { refresh_token: refreshToken },
          { skipAuth: true },
        );
      } catch {
        // Best-effort revoke — clear local state regardless.
      }
    }
    tokenStorage.clear();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
