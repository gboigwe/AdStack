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
