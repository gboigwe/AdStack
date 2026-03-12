/**
 * Full-page loading spinner used as a Suspense fallback.
 */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]" role="status">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
        <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
      </div>
    </div>
  );
}

/**
 * Inline loader for component-level Suspense boundaries.
 * Renders a small centered spinner within its container.
 */
export function InlineLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-8 ${className}`} role="status">
      <div className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
