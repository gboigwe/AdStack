/**
 * use-budget-tracker.ts
 * React hook for real-time campaign budget monitoring.
 * Polls the chain for budget state and computes spend rate,
 * utilization, and projected exhaustion.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchCampaignBudgetState,
  CampaignBudgetState,
  formatUtilization,
} from '@/lib/campaign-budget-tracker';
import { SupportedNetwork } from '@/lib/stacks-network';

export interface BudgetTrackerState {
  budget: CampaignBudgetState | null;
  utilizationFormatted: string;
  isAlertThreshold: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Alert when utilization exceeds this threshold */
const ALERT_THRESHOLD_PERCENT = 80;

/**
 * Hook to track a campaign's real-time budget state.
 * Polls every 2 minutes; budget data changes slowly on-chain.
 */
export function useBudgetTracker(
  campaignId: number | undefined,
  pollIntervalMs = 120_000,
  network?: SupportedNetwork,
): BudgetTrackerState {
  const [budget, setBudget] = useState<CampaignBudgetState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBudget = useCallback(async () => {
    if (campaignId === undefined) return;

    setLoading(true);
    setError(null);

    try {
      const state = await fetchCampaignBudgetState(campaignId, network);
      setBudget(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch budget');
    } finally {
      setLoading(false);
    }
  }, [campaignId, network]);

  useEffect(() => {
    fetchBudget();

    if (pollIntervalMs > 0) {
      const interval = setInterval(fetchBudget, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchBudget, pollIntervalMs]);

  const utilizationPercent = budget?.utilizationPercent ?? 0;

  return {
    budget,
    utilizationFormatted: formatUtilization(utilizationPercent),
    isAlertThreshold: utilizationPercent >= ALERT_THRESHOLD_PERCENT,
    loading,
    error,
    refetch: fetchBudget,
  };
}

/**
 * Check if a campaign is approaching budget exhaustion.
 * Returns true if less than 20% budget remains.
 */
export function useBudgetAlert(campaignId: number | undefined): boolean {
  const { isAlertThreshold } = useBudgetTracker(campaignId);
  return isAlertThreshold;
}
