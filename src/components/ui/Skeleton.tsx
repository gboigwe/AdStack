interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

/**
 * Animated skeleton placeholder for loading states.
 * Uses a pulse animation over a gray background.
 *
 * @example
 * <Skeleton className="h-4 w-32" />  // text line
 * <Skeleton className="h-12 w-12 rounded-full" />  // avatar
 */
export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Skeleton group that renders N skeleton lines for list previews.
 */
export function SkeletonLines({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === count - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton that mirrors the StatCard layout — icon circle + text block.
 * Drop-in replacement for StatCard while data is loading.
 */
export function SkeletonStatCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-3.5 w-20 mb-3" />
          <Skeleton className="h-7 w-28 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
      </div>
    </div>
  );
}

/**
 * Skeleton for a card with a heading row and a few content lines.
 * Useful for dashboard sections, campaign cards, etc.
 */
export function SkeletonCard({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <Skeleton className="h-5 w-40 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton
            key={i}
            className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Row of SkeletonStatCards in a responsive grid.
 * Matches the typical 2- or 4-column stat grid layout.
 */
export function SkeletonStatGrid({ count = 4, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
}
