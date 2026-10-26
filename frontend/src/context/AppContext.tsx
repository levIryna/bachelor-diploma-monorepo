import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchCurrentUser, loginRequest, logoutRequest } from '../api/auth';
import { onSessionEnded } from '../auth/session';
import type { AuthUser } from '../types/auth';
import { AppContext, type Theme } from './app-context';

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    sessionStorage.removeItem('accessToken');

    const unsubscribe = onSessionEnded(() => {
      setUser(null);
    });

    let cancelled = false;
    fetchCurrentUser()
      .then((nextUser) => {
        if (!cancelled) {
          setUser(nextUser);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsAuthReady(true);
        }
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await loginRequest(email, password);
    try {
      const nextUser = await fetchCurrentUser();
      setUser(nextUser);
    } catch (error) {
      await logoutRequest().catch(() => undefined);
      setUser(null);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    void logoutRequest()
      .catch(() => undefined)
      .finally(() => setUser(null));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      isAuthReady,
      isLoggedIn: user !== null,
      user,
      login,
      logout,
    }),
    [theme, isAuthReady, user, login, logout],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
