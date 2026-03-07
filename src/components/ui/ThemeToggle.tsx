'use client';

import { useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore, initTheme } from '@/store/theme-store';

const THEME_OPTIONS = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'system' as const, icon: Monitor, label: 'System' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, []);

  const current = THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[2];
  const next = THEME_OPTIONS[(THEME_OPTIONS.indexOf(current) + 1) % THEME_OPTIONS.length];

  return (
    <button
      onClick={() => setTheme(next.value)}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      aria-label={`Switch to ${next.label} theme`}
      title={`Current: ${current.label}. Click for ${next.label}`}
    >
      <current.icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
  );
}
