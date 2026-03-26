// useFeeEstimate: estimate transaction fee via Hiro API
import { useState, useCallback } from 'react';

export interface FeeEstimate {
  low: bigint;
  medium: bigint;
  high: bigint;
}
