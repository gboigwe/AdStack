'use client';

import { useState, useEffect } from 'react';

/**
 * Returns true once the component has mounted on the client.
 *
 * Useful for guarding client-only rendering to avoid hydration
 * mismatches when SSR output differs from the initial client render
 * (e.g. wallet state, theme, localStorage-dependent UI).
 *
 * @example
 * const mounted = useMounted();
 * if (!mounted) return <Skeleton />;
 * return <WalletBalance />;
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
