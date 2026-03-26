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
