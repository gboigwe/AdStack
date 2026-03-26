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
