/**
 * use-event-index.ts
 * React hook to access and refresh the AdStack event index.
 * Provides reactive access to the in-memory event store populated
 * by stacks-indexer.ts.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  initEventIndex,
  getEventIndex,
  getCampaignEvents,
  getEventsByType,
  EventIndex,
} from '@/lib/stacks-indexer';
import type { DecodedEvent } from '@/lib/event-decoder';
import { SupportedNetwork } from '@/lib/stacks-network';

export interface EventIndexState {
  index: EventIndex;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to initialize and access the AdStack event index.
 * Syncs on mount and exposes a refetch trigger.
 */
export function useEventIndex(
  network?: SupportedNetwork,
): EventIndexState {
  const [index, setIndex] = useState<EventIndex>(getEventIndex);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const updated = await initEventIndex(100, network);
      setIndex({ ...updated });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync events');
    } finally {
      setLoading(false);
    }
  }, [network]);

  useEffect(() => {
    sync();
  }, [sync]);

  return { index, loading, error, refetch: sync };
}

/**
 * Hook to get all events for a specific campaign.
 */
export function useCampaignIndexedEvents(
  campaignId: number | undefined,
  network?: SupportedNetwork,
): { events: DecodedEvent[]; loading: boolean } {
  const { index, loading } = useEventIndex(network);

  const events = campaignId !== undefined
    ? getCampaignEvents(campaignId)
    : [];

  return { events, loading };
}

/**
 * Hook to get a count of campaigns created (from index).
 */
export function useCampaignCreatedCount(network?: SupportedNetwork): number {
  const { index } = useEventIndex(network);
  return index.byType.get('campaign-created')?.length ?? 0;
}
