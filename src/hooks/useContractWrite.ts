// useContractWrite: submit a Clarity contract call transaction
import { useState, useCallback } from 'react';

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export interface ContractWriteParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs?: unknown[];
  postConditions?: unknown[];
  network?: 'mainnet' | 'testnet';
  onFinish?: (txId: string) => void;
  onCancel?: () => void;
}
