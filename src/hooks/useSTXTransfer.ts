// useSTXTransfer: initiate a STX transfer via Stacks Connect
import { useState, useCallback } from 'react';

export interface STXTransferParams {
  recipient: string;
  amount: string;
  memo?: string;
  network?: 'mainnet' | 'testnet';
  onFinish?: (txId: string) => void;
  onCancel?: () => void;
}

export interface STXTransferState {
  txId: string | null;
  status: 'idle' | 'pending' | 'success' | 'error';
  error: string | null;
}
