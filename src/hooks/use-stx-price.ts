/**
 * use-stx-price.ts
 * React hook for live STX/USD price data.
 * Polls CoinGecko via stx-price.ts and exposes formatted conversion helpers.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchSTXPrice,
  formatMicroStx,
  microStxToStx,
  stxToMicroStx,
  usdToMicroStx,
  STXPrice,
  PriceConversion,
} from '@/lib/stx-price';

export interface STXPriceState {
  price: STXPrice | null;
  usdPerStx: number;
  loading: boolean;
  error: string | null;
  /** Convert micro-STX to formatted STX and USD */
  convertMicroStx: (microStx: bigint | number) => PriceConversion;
  /** Convert USD to micro-STX at current price */
  convertUsd: (usd: number) => bigint;
  refetch: () => void;
}

/**
 * Hook providing live STX/USD price and conversion utilities.
 * Refreshes every 60 seconds.
 */
export function useSTXPrice(pollIntervalMs = 60_000): STXPriceState {
  const [price, setPrice] = useState<STXPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchSTXPrice();
      setPrice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();

    const interval = setInterval(fetchPrice, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchPrice, pollIntervalMs]);

  const usdPerStx = price?.usd ?? 0;

  return {
    price,
    usdPerStx,
    loading,
    error,
    convertMicroStx: (microStx) => formatMicroStx(microStx, usdPerStx),
    convertUsd: (usd) => usdToMicroStx(usd, usdPerStx),
    refetch: fetchPrice,
  };
}

/**
 * Hook providing just the current STX/USD price as a number.
 * Minimal version for components that only need the price.
 */
export function useSTXUSDPrice(): number {
  const { usdPerStx } = useSTXPrice();
  return usdPerStx;
}
