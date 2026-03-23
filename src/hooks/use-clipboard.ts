'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * Hook for copying text to the clipboard with a temporary "copied" state.
 * @param resetDelay — ms before `copied` flips back to false (default 2000)
 */
export function useClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), resetDelay);
        return true;
      } catch {
        setCopied(false);
        return false;
      }
    },
    [resetDelay],
  );

  return { copied, copy } as const;
}
