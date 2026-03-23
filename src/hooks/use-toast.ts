'use client';

import { useCallback } from 'react';
import { useToastStore } from '@/store/toast-store';

/**
 * Convenience hook for showing toast notifications.
 *
 * @example
 * const toast = useToast();
 * toast.success('Saved!');
 * toast.error('Failed to save', 'Check your network connection');
 */
export function useToast() {
  const addToast = useToastStore((s) => s.addToast);

  const success = useCallback(
    (title: string, message?: string) => addToast({ type: 'success', title, message }),
    [addToast],
  );

  const error = useCallback(
    (title: string, message?: string) => addToast({ type: 'error', title, message }),
    [addToast],
  );

  const info = useCallback(
    (title: string, message?: string) => addToast({ type: 'info', title, message }),
    [addToast],
  );

  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    [addToast],
  );

  return { success, error, info, warning };
}
