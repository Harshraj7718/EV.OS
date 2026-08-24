import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { api, tokenStore, getErrorMessage, ApiSuccess } from '@/lib/api';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(tokenStore.get()));
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoggingIn(true);
    try {
      const response = await api.post<ApiSuccess<{ token: string }>>('/admin/login', {
        username,
        password,
      });
      tokenStore.set(response.data.data.token);
      setIsAuthenticated(true);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoggingIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
