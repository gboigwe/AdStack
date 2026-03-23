import { type ReactNode } from 'react';

const VARIANT_CLASSES = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
} as const;

type BadgeVariant = keyof typeof VARIANT_CLASSES;

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Small inline badge for status labels, categories, and tags.
 * Renders as a pill-shaped span with semantic color variants.
 */
export function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Map a campaign status string to the appropriate badge variant.
 */
export function campaignStatusVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case 'active':
      return 'success';
    case 'paused':
      return 'warning';
    case 'completed':
      return 'info';
    case 'cancelled':
      return 'error';
    case 'draft':
    default:
      return 'default';
  }
}
