'use client';

import { memo } from 'react';

type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<CampaignStatus, { label: string; classes: string; dot: string }> = {
  draft: {
    label: 'Draft',
    classes: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    dot: 'bg-gray-400',
  },
  active: {
    label: 'Active',
    classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    dot: 'bg-green-500',
  },
  paused: {
    label: 'Paused',
    classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    dot: 'bg-yellow-500',
  },
  completed: {
    label: 'Completed',
    classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    dot: 'bg-red-500',
  },
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

/**
 * Campaign status indicator with colored dot and label.
 * Falls back to a neutral gray style for unknown statuses.
 */
export const StatusBadge = memo(function StatusBadge({
  status,
  size = 'sm',
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status.toLowerCase() as CampaignStatus] ?? STATUS_CONFIG.draft;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.classes} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  );
});
