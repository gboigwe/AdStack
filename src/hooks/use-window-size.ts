'use client';

import { useSyncExternalStore } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

function getSnapshot(): WindowSize {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function getServerSnapshot(): WindowSize {
  return { width: 0, height: 0 };
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

/**
 * Reactive window dimensions using useSyncExternalStore.
 * Re-renders when the window is resized. Returns { width, height }.
 *
 * Use useMediaQuery for breakpoint checks — this hook is for when
 * you need exact pixel dimensions (e.g., canvas sizing, charts).
 *
 * @example
 * const { width, height } = useWindowSize();
 * const chartWidth = Math.min(width - 32, 800);
 */
export function useWindowSize(): WindowSize {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
