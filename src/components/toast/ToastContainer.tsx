'use client';

import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useToastStore, type ToastType } from '@/store/toast-store';

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-yellow-200 bg-yellow-50',
  info: 'border-blue-200 bg-blue-50',
};

const iconStyles: Record<ToastType, string> = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
};

/**
 * Renders all active toasts in a fixed position at the top-right
 * of the viewport. Should be mounted once in the root layout.
 */
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto border rounded-lg p-4 shadow-lg animate-in slide-in-from-right ${styles[toast.type]}`}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconStyles[toast.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{toast.title}</p>
                {toast.message && (
                  <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
