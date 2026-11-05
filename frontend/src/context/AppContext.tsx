import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchCurrentUser, loginRequest, logoutRequest } from '../api/auth';
import { notifyAuthChanged, onAuthChanged, onSessionEnded } from '../auth/session';
import type { AuthUser } from '../types/auth';
import { applyChartTheme } from '../charts_config/chartTheme';
import { AppContext, type Theme } from './app-context';

const THEME_STORAGE_KEY = 'theme';

function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  applyChartTheme();
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The browser blocked storage. The theme still applies for this visit.
  }
}

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = readStoredTheme();
    applyTheme(stored);
    return stored;
  });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    sessionStorage.removeItem('accessToken');

    let cancelled = false;
    let requestId = 0;

    const refreshSession = () => {
      const id = ++requestId;
      fetchCurrentUser({ quiet: true })
        .then((nextUser) => {
          if (!cancelled && id === requestId) {
            setUser(nextUser);
          }
        })
        .catch(() => {
          if (!cancelled && id === requestId) {
            setUser(null);
          }
        })
        .finally(() => {
          if (!cancelled && id === requestId) {
            setIsAuthReady(true);
          }
        });
    };

    const unsubscribeEnded = onSessionEnded(() => {
      setUser(null);
    });
    const unsubscribeChanged = onAuthChanged(refreshSession);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshSession();
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    refreshSession();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      unsubscribeEnded();
      unsubscribeChanged();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await loginRequest(email, password);
    try {
      const nextUser = await fetchCurrentUser();
      setUser(nextUser);
      notifyAuthChanged();
    } catch (error) {
      await logoutRequest().catch(() => undefined);
      setUser(null);
      notifyAuthChanged();
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    void logoutRequest()
      .catch(() => undefined)
      .finally(() => {
        setUser(null);
        notifyAuthChanged();
      });
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
