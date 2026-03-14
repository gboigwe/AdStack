'use client';

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: ButtonVariant;
  /** Label shown when loading (defaults to children) */
  loadingText?: string;
  children: ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus-visible:ring-blue-500',
  secondary:
    'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 focus-visible:ring-gray-400',
  danger:
    'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus-visible:ring-red-500',
};

/**
 * Button with built-in loading spinner and disabled state.
 *
 * When `loading` is true, renders an animated spinner, optionally
 * swaps the label to `loadingText`, and disables the button to
 * prevent duplicate submissions.
 */
export function LoadingButton({
  loading = false,
  variant = 'primary',
  loadingText,
  children,
  disabled,
  className,
  ...rest
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_STYLES[variant],
        className,
      )}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
