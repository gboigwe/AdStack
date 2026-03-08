'use client';

import { useSyncExternalStore, useCallback } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

/**
 * Reactive hook that tracks browser online/offline status.
 * Uses useSyncExternalStore for tear-free reads.
 */
export function useNetworkStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const waitForOnline = useCallback(
    () =>
      new Promise<void>((resolve) => {
        if (navigator.onLine) return resolve();
        window.addEventListener('online', () => resolve(), { once: true });
      }),
    [],
  );

  return { isOnline, waitForOnline };
}
