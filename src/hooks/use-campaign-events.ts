/**
 * use-campaign-events.ts
 * React hook for real-time AdStack campaign event streaming.
 * Fetches and decodes on-chain print events from promo-manager
 * and funds-keeper contracts.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchContractEvents } from '@/lib/hiro-api';
import { decodeAdStackEvents, DecodedEvent } from '@/lib/event-decoder';
import { getApiUrl, SupportedNetwork } from '@/lib/stacks-network';
import { CONTRACT_ADDRESS, CONTRACTS } from '@/lib/stacks-config';
import type {
  OnChainCampaignCreatedEvent,
  OnChainEscrowCreatedEvent,
  OnChainFundsReleasedEvent,
  OnChainFundsRefundedEvent,
} from '@/types/contracts';

export interface CampaignEventState {
  events: DecodedEvent[];
  campaignCreatedEvents: DecodedEvent<OnChainCampaignCreatedEvent>[];
  fundsReleasedEvents: DecodedEvent<OnChainFundsReleasedEvent>[];
  fundsRefundedEvents: DecodedEvent<OnChainFundsRefundedEvent>[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to stream campaign lifecycle events from on-chain contracts.
 * Polls promo-manager and funds-keeper for print events and decodes them.
 */
export function useCampaignEvents(
  pollIntervalMs = 30_000,
  limit = 50,
  network?: SupportedNetwork,
): CampaignEventState {
  const [events, setEvents] = useState<DecodedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setError(null);

    try {
      const promoId = `${CONTRACT_ADDRESS}.${CONTRACTS.PROMO_MANAGER}`;
      const fundsId = `${CONTRACT_ADDRESS}.${CONTRACTS.FUNDS_KEEPER}`;

      const [promoEvents, fundsEvents] = await Promise.all([
        fetchContractEvents(promoId, { limit, network }),
        fetchContractEvents(fundsId, { limit, network }),
      ]);

      const allRaw = [
        ...(promoEvents.results ?? []),
        ...(fundsEvents.results ?? []),
      ];

      const decoded = decodeAdStackEvents(allRaw);

      // Sort by event index (most recent first)
      decoded.sort((a, b) => b.raw.event_index - a.raw.event_index);

      setEvents(decoded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [limit, network]);

  useEffect(() => {
    fetchEvents();

    const interval = setInterval(fetchEvents, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchEvents, pollIntervalMs]);

  const campaignCreatedEvents = events.filter(
    (e) => e.event.event === 'campaign-created',
  ) as DecodedEvent<OnChainCampaignCreatedEvent>[];

  const fundsReleasedEvents = events.filter(
    (e) => e.event.event === 'funds-released',
  ) as DecodedEvent<OnChainFundsReleasedEvent>[];

  const fundsRefundedEvents = events.filter(
    (e) => e.event.event === 'funds-refunded',
  ) as DecodedEvent<OnChainFundsRefundedEvent>[];

  return {
    events,
    campaignCreatedEvents,
    fundsReleasedEvents,
    fundsRefundedEvents,
    loading,
    error,
    refetch: fetchEvents,
  };
}

/**
 * Hook to get events for a specific campaign ID.
 */
export function useCampaignEventsByCampaign(
  campaignId: number | undefined,
  network?: SupportedNetwork,
): { events: DecodedEvent[]; loading: boolean } {
  const { events, loading } = useCampaignEvents(60_000, 100, network);

  const filtered = campaignId !== undefined
    ? events.filter((e) => {
        const ev = e.event as any;
        return Number(ev['campaign-id'] ?? ev['payout-id'] ?? -1) === campaignId;
      })
    : [];

  return { events: filtered, loading };
}
