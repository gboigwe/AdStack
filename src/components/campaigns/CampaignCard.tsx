'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Card, ProgressBar } from '@/components/ui';
import { formatSTXWithSymbol } from '@/lib/display-utils';
import type { CampaignStatus } from '@/types/contracts';

export interface CampaignCardData {
  id: number;
  name: string;
  status: CampaignStatus;
  budget: bigint;
  spent: bigint;
  startHeight: number;
  endHeight: number;
}

/**
 * Campaign summary card for list views.
 *
 * Displays name, status badge, budget progress bar, and a link
 * to the campaign detail page. Memoized to avoid re-renders when
 * sibling cards update.
 */
export const CampaignCard = memo(function CampaignCard({
  campaign,
}: {
  campaign: CampaignCardData;
}) {
  const budgetUsed =
    campaign.budget > 0n
      ? Number((campaign.spent * 10000n) / campaign.budget) / 10000
      : 0;

  const variant =
    budgetUsed > 0.9
      ? 'error'
      : budgetUsed > 0.7
        ? 'warning'
        : 'default';

  return (
    <Card hoverable noPadding className="group">
      <Link
        href={`/advertiser/campaigns/${campaign.id}`}
        className="block p-5"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {campaign.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Campaign #{campaign.id}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={campaign.status} />
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Budget</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatSTXWithSymbol(campaign.spent, 2)} / {formatSTXWithSymbol(campaign.budget, 2)}
            </span>
          </div>
          <ProgressBar
            value={budgetUsed}
            variant={variant}
            size="sm"
          />
        </div>
      </Link>
    </Card>
  );
});
