// useFeeEstimate: estimate transaction fee via Hiro API
import { useState, useCallback } from 'react';

export interface FeeEstimate {
  low: bigint;
  medium: bigint;
  high: bigint;
}

export interface FeeEstimateState {
  estimate: FeeEstimate | null;
  isLoading: boolean;
  error: string | null;
}

const MIN_FEE = 180n;
const FEE_MULTIPLIERS = { low: 1n, medium: 2n, high: 5n } as const;

async function fetchFeeRate(): Promise<bigint> {
  const res = await fetch('https://api.hiro.so/v2/fees/transfer');
  if (!res.ok) throw new Error(`Fee estimate failed: ${res.status}`);
  const data = await res.json() as { fee_rate?: string | number };
  return BigInt(data.fee_rate ?? 180);
}

export function useFeeEstimate(byteLength = 250) {
  const [state, setState] = useState<FeeEstimateState>({
    estimate: null, isLoading: false, error: null,
  });

  const estimate = useCallback(async () => {
    setState({ estimate: null, isLoading: true, error: null });
    try {
      const feeRate = await fetchFeeRate();
      const base = feeRate * BigInt(byteLength);
      const result: FeeEstimate = {
        low: base < MIN_FEE ? MIN_FEE : base * FEE_MULTIPLIERS.low,
        medium: base < MIN_FEE ? MIN_FEE * 2n : base * FEE_MULTIPLIERS.medium,
        high: base < MIN_FEE ? MIN_FEE * 5n : base * FEE_MULTIPLIERS.high,
      };
      setState({ estimate: result, isLoading: false, error: null });
    } catch (e) {
      setState({ estimate: null, isLoading: false, error: String(e) });
    }
  }, [byteLength]);

  return { ...state, estimate };
}
