import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Adds a hover border highlight */
  hoverable?: boolean;
  /** Removes padding — caller controls inner layout */
  noPadding?: boolean;
}

/**
 * Generic card container with consistent border, radius, and dark mode.
 *
 * Reduces repeated `bg-white dark:bg-gray-900 rounded-xl border ...`
 * patterns throughout the codebase.
 */
export function Card({ children, className, hoverable = false, noPadding = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700',
        hoverable && 'transition-colors hover:border-blue-200 dark:hover:border-blue-800',
        !noPadding && 'p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  /** Optional right-side content (e.g. action button) */
  action?: ReactNode;
}

/**
 * Card header with bottom border and optional action slot.
 */
export function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700',
        className,
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {children}
      </h3>
      {action}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

/**
 * Card body section with standard padding.
 */
export function CardBody({ children, className }: CardBodyProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
}
