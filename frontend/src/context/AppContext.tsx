import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

export type Theme = 'light' | 'dark';

type AppContextValue = {
  theme: Theme;
  setTheme: Dispatch<SetStateAction<Theme>>;
  isLoggedIn: boolean;
  setLoggedIn: Dispatch<SetStateAction<boolean>>;
  /** Мок ролі до підключення API; активна лише коли `isLoggedIn`. */
  userRole: string;
};

const AppContext = createContext<AppContextValue | null>(null);

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoggedIn, setLoggedIn] = useState(false);
  const userRole = 'admin';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      isLoggedIn,
      setLoggedIn,
      userRole,
    }),
    [theme, isLoggedIn, userRole],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
