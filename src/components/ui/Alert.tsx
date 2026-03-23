import { type ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  /** Show a dismiss button */
  onDismiss?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<AlertVariant, string> = {
  info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
  success: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
  warning: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300',
  error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
};

const VARIANT_ICONS: Record<AlertVariant, typeof Info> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

/**
 * Inline alert banner for contextual messages.
 *
 * Supports four semantic variants with matching icon and colors.
 * Optional dismiss button and title for structured alerts.
 */
export function Alert({
  variant = 'info',
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  const Icon = VARIANT_ICONS[variant];

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-lg border p-4',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-medium mb-1">{title}</p>
        )}
        <div className="text-sm">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
