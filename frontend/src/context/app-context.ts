import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type { AuthUser } from '../types/auth';

export type Theme = 'light' | 'dark';

export type AppContextValue = {
  theme: Theme;
  setTheme: Dispatch<SetStateAction<Theme>>;
  isAuthReady: boolean;
  isLoggedIn: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
