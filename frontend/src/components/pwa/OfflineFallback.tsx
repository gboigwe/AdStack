'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
}

export function OfflineBanner({ isOnline }: OfflineBannerProps) {
  if (isOnline) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            You are currently offline. Some features may be limited.
          </span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-900 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    </div>
  );
}

interface OfflineCardProps {
  title?: string;
  message?: string;
}

export function OfflineCard({ title = 'Content Unavailable', message }: OfflineCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <WifiOff className="w-10 h-10 text-gray-400 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">
        {message || 'This content is not available offline. It will load when you reconnect.'}
      </p>
    </div>
  );
}

interface OfflineGateProps {
  isOnline: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function OfflineGate({ isOnline, fallback, children }: OfflineGateProps) {
  if (!isOnline) {
    return <>{fallback || <OfflineCard />}</>;
  }
  return <>{children}</>;
}
