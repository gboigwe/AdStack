'use client';

import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks';

/**
 * Renders a fixed banner at the top of the viewport when the browser
 * loses internet connectivity. Automatically disappears when online.
 */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white text-sm text-center py-2 px-4 flex items-center justify-center gap-2"
    >
      <WifiOff className="w-4 h-4" />
      <span>You are offline. Some features may be unavailable.</span>
    </div>
  );
}
