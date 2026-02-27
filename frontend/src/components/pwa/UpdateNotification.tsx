'use client';

import { useState, useCallback } from 'react';
import { RefreshCw, X, Download } from 'lucide-react';
import { usePWAContext } from './PWAProvider';

export function UpdateNotification() {
  const { updateAvailable, applyUpdate } = usePWAContext();
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white rounded-xl border border-blue-200 shadow-lg p-4 z-50">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Update Available</h3>
            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            A new version of AdStack is available. Update now to get the latest features and improvements.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={applyUpdate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Update Now
            </button>
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
