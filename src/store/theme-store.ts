'use client';

import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem('adstack_theme');
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getStoredTheme(),

  setTheme: (theme: Theme) => {
    localStorage.setItem('adstack_theme', theme);
    applyTheme(theme);
    set({ theme });
  },
}));

/**
 * Call once on app mount to apply the saved theme and
 * listen for OS-level preference changes when theme is 'system'.
 */
const THEME_KEY = 'adstack_theme';

/**
 * Call once on app mount to apply the saved theme,
 * listen for OS-level preference changes, and sync across tabs.
 */
export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);

  // OS preference listener
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', () => {
    const current = useThemeStore.getState().theme;
    if (current === 'system') applyTheme('system');
  });

  // Cross-tab sync: another tab changed the theme
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_KEY || !event.newValue) return;
    const newTheme = event.newValue as Theme;
    if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
      applyTheme(newTheme);
      useThemeStore.setState({ theme: newTheme });
    }
  });
}
