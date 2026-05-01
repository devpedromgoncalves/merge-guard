import { useState, useEffect } from 'react';

export interface Theme {
  bg: {
    primary: string;
    secondary: string;
    tertiary: string;
    code: string;
    hover: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
  };
  border: {
    primary: string;
    secondary: string;
  };
  button: {
    bg: string;
    text: string;
    border: string;
    hoverBg: string;
    hoverBorder: string;
  };
  severity: {
    critical: string;
    warning: string;
    info: string;
    success: string;
  };
  shadow: string;
}

const lightTheme: Theme = {
  bg: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f4f4f5',
    code: '#f8f9fa',
    hover: '#f4f4f5'
  },
  text: {
    primary: '#09090b',
    secondary: '#27272a',
    tertiary: '#3f3f46',
    muted: '#52525b'
  },
  border: {
    primary: '#e4e4e7',
    secondary: '#f4f4f5'
  },
  button: {
    bg: '#18181b',
    text: '#fafafa',
    border: '#27272a',
    hoverBg: '#09090b',
    hoverBorder: '#3f3f46'
  },
  severity: {
    critical: '#dc2626',
    warning: '#f59e0b',
    info: '#3b82f6',
    success: '#10b981'
  },
  shadow: 'rgba(0, 0, 0, 0.1)'
};

export const darkTheme: Theme = {
  bg: {
    primary: '#1a1a1a',
    secondary: '#27272a',
    tertiary: '#3f3f46',
    code: '#27272a',
    hover: '#3f3f46'
  },
  text: {
    primary: '#fafafa',
    secondary: '#e4e4e7',
    tertiary: '#d4d4d8',
    muted: '#a1a1aa'
  },
  border: {
    primary: '#3f3f46',
    secondary: '#52525b'
  },
  button: {
    bg: '#27272a',
    text: '#fafafa',
    border: '#52525b',
    hoverBg: '#3f3f46',
    hoverBorder: '#71717a'
  },
  severity: {
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#60a5fa',
    success: '#22c55e'
  },
  shadow: 'rgba(0, 0, 0, 0.3)'
};

export type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_EVENT = 'merge-guard-theme-change';
const THEME_STORAGE_KEY = 'themeMode';

function getChromeStorage() {
  return (globalThis as any).chrome?.storage?.local ?? null;
}

export function useTheme(): Theme & { mode: ThemeMode; setMode: (mode: ThemeMode) => void; isDark: boolean } {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load from chrome.storage
    const storage = getChromeStorage();
    if (storage) {
      storage.get([THEME_STORAGE_KEY], (result: Record<string, string>) => {
        if (result[THEME_STORAGE_KEY]) {
          setModeState(result[THEME_STORAGE_KEY] as ThemeMode);
        }
      });
      const onChanged = (changes: Record<string, { newValue?: unknown }>) => {
        if (THEME_STORAGE_KEY in changes && changes[THEME_STORAGE_KEY].newValue) {
          setModeState(changes[THEME_STORAGE_KEY].newValue as ThemeMode);
        }
      };
      (globalThis as any).chrome.storage.onChanged.addListener(onChanged);

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
      mediaQuery.addEventListener('change', handleSystemChange);

      const handleThemeChange = (e: Event) => {
        const newMode = (e as CustomEvent<ThemeMode>).detail;
        setModeState(newMode);
      };
      window.addEventListener(THEME_EVENT, handleThemeChange);

      return () => {
        (globalThis as any).chrome.storage.onChanged.removeListener(onChanged);
        mediaQuery.removeEventListener('change', handleSystemChange);
        window.removeEventListener(THEME_EVENT, handleThemeChange);
      };
    }
  }, []);

  const setMode = (newMode: ThemeMode) => {
    const storage = getChromeStorage();
    if (storage) {
      storage.set({ [THEME_STORAGE_KEY]: newMode });
    }
    window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_EVENT, { detail: newMode }));
    setModeState(newMode);
  };

  const isDark = mode === 'auto' ? systemIsDark : mode === 'dark';

  return { ...(isDark ? darkTheme : lightTheme), mode, setMode, isDark };
}
