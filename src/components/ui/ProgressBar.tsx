'use client';

import { memo } from 'react';

interface ProgressBarProps {
  /** Progress value between 0 and 1 */
  value: number;
  /** Label shown above the bar */
  label?: string;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Color variant */
  variant?: 'blue' | 'green' | 'yellow' | 'red';
  /** Bar height */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VARIANT_CLASSES = {
  blue: 'bg-blue-600 dark:bg-blue-500',
  green: 'bg-green-600 dark:bg-green-500',
  yellow: 'bg-yellow-500 dark:bg-yellow-400',
  red: 'bg-red-600 dark:bg-red-500',
} as const;

const SIZE_CLASSES = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
} as const;

/**
 * Accessible progress bar with label, percentage, and color variants.
 * Use for budget utilisation, upload progress, or completion tracking.
 */
export const ProgressBar = memo(function ProgressBar({
  value,
  label,
  showPercentage = false,
  variant = 'blue',
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const percentage = Math.round(clamped * 100);

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden ${SIZE_CLASSES[size]}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? `${percentage}% complete`}
      >
        <div
          className={`${SIZE_CLASSES[size]} rounded-full transition-all duration-500 ${VARIANT_CLASSES[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});
