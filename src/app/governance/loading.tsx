import { Skeleton } from '@/components/ui';

export default function GovernanceLoading() {
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>

        {/* Proposal form skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <Skeleton className="h-6 w-36 mb-4" />
          <Skeleton className="h-10 w-full mb-3" />
          <Skeleton className="h-24 w-full mb-3" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Proposals list skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-3/4 mb-4" />
              <div className="flex gap-3">
                <Skeleton className="h-8 w-20 rounded" />
                <Skeleton className="h-8 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
