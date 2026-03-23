'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutOptions {
  /** The keyboard key to listen for (e.g. 'k', 'Escape', '/') */
  key: string;
  /** Modifier keys required */
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  /** Ignore events from input/textarea/select elements (default true) */
  ignoreInputs?: boolean;
}

/**
 * Registers a global keyboard shortcut and calls the handler when matched.
 * Automatically cleans up on unmount.
 *
 * @example
 * useKeyboardShortcut({ key: 'k', ctrlKey: true }, () => openSearch());
 * useKeyboardShortcut({ key: 'Escape' }, () => closeModal());
 */
export function useKeyboardShortcut(
  options: ShortcutOptions,
  handler: () => void,
) {
  const { key, ctrlKey = false, metaKey = false, shiftKey = false, ignoreInputs = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if typing in an input field
      if (ignoreInputs) {
        const target = event.target as HTMLElement;
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
          return;
        }
      }

      const matchesKey = event.key.toLowerCase() === key.toLowerCase();
      const matchesCtrl = ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const matchesMeta = metaKey ? event.metaKey : true;
      const matchesShift = shiftKey ? event.shiftKey : !event.shiftKey;

      if (matchesKey && matchesCtrl && matchesMeta && matchesShift) {
        event.preventDefault();
        handler();
      }
    },
    [key, ctrlKey, metaKey, shiftKey, ignoreInputs, handler],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
