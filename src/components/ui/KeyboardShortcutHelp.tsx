'use client';

import { useState } from 'react';
import { Keyboard } from 'lucide-react';
import { Modal } from './Modal';
import { useKeyboardShortcut } from '@/hooks/use-keyboard-shortcut';

interface ShortcutEntry {
  keys: string[];
  description: string;
}

const SHORTCUT_SECTIONS: { title: string; shortcuts: ShortcutEntry[] }[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['g', 'h'], description: 'Go to home / dashboard' },
      { keys: ['g', 't'], description: 'Go to transactions' },
      { keys: ['g', 'c'], description: 'Go to campaigns' },
      { keys: ['g', 'v'], description: 'Go to governance' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { keys: ['Ctrl', 'k'], description: 'Open search' },
      { keys: ['n'], description: 'New campaign' },
      { keys: ['?'], description: 'Show this help dialog' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['Esc'], description: 'Close dialog / cancel' },
      { keys: ['↑'], description: 'Scroll to top' },
    ],
  },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 text-xs font-mono font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
      {children}
    </kbd>
  );
}

/**
 * Keyboard shortcut help dialog, opened with the `?` key.
 * Lists all registered shortcuts grouped by category.
 */
export function KeyboardShortcutHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useKeyboardShortcut(
    { key: '?', shiftKey: true },
    () => setIsOpen(true),
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Keyboard Shortcuts"
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {SHORTCUT_SECTIONS.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <div className="space-y-2">
              {section.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.description}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((k, i) => (
                      <span key={k} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-xs text-gray-400">+</span>
                        )}
                        <Kbd>{k}</Kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Press <Kbd>?</Kbd> anywhere to toggle this dialog
        </p>
      </div>
    </Modal>
  );
}
