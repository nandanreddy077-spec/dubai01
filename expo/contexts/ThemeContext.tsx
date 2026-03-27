import { useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const [ThemeProvider, useTheme] = createContextHook<ThemeContextType>(() => {
  const theme = 'light' as ThemeMode;

  const setTheme = useCallback((newTheme: ThemeMode) => {
    console.log('Theme is locked to light mode');
  }, []);

  const toggleTheme = useCallback(() => {
    console.log('Theme is locked to light mode');
  }, []);

  return useMemo(() => ({
    theme,
    toggleTheme,
    setTheme,
  }), [theme, toggleTheme, setTheme]);
});