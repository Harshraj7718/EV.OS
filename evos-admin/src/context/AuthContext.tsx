import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { toast } from 'sonner';
import { api, tokenStore, getErrorMessage, ApiSuccess } from '@/lib/api';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 1000;
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(tokenStore.get()));
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastActivityRef = useRef(0);

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

  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      const now = Date.now();
      const recentlyReset = now - lastActivityRef.current < ACTIVITY_THROTTLE_MS;
      // Only skip when a timer is already pending — otherwise a throttled call right
      // after mount/cleanup (e.g. React StrictMode's dev double-invoke) could leave no
      // timer scheduled at all.
      if (recentlyReset && inactivityTimeoutRef.current) return;
      lastActivityRef.current = now;

      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = setTimeout(() => {
        logout();
        toast.info("You've been signed out due to inactivity");
      }, INACTIVITY_LIMIT_MS);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated, logout]);

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
