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

export interface ContractWriteState {
  txId: string | null;
  status: TxStatus;
  error: string | null;
}

export function useContractWrite(params: ContractWriteParams) {
  const [state, setState] = useState<ContractWriteState>({
    txId: null,
    status: 'idle',
    error: null,
  });

  const write = useCallback(async (overrides?: Partial<ContractWriteParams>) => {
    const merged = { ...params, ...overrides };
    setState({ txId: null, status: 'pending', error: null });
    try {
      const { openContractCall } = await import('@stacks/connect');
      await openContractCall({
        contractAddress: merged.contractAddress,
        contractName: merged.contractName,
        functionName: merged.functionName,
        functionArgs: (merged.functionArgs as import('@stacks/transactions').ClarityValue[]) ?? [],
        postConditions: (merged.postConditions as import('@stacks/transactions').PostCondition[]) ?? [],
        network: merged.network === 'testnet' ? new (await import('@stacks/network')).StacksTestnet() : new (await import('@stacks/network')).StacksMainnet(),
        onFinish: (data) => {
          setState({ txId: data.txId, status: 'success', error: null });
          merged.onFinish?.(data.txId);
        },
        onCancel: () => {
          setState(prev => ({ ...prev, status: 'idle' }));
          merged.onCancel?.();
        },
      });
    } catch (e) {
      setState({ txId: null, status: 'error', error: String(e) });
    }
  }, [params]);

  const reset = useCallback(() => {
    setState({ txId: null, status: 'idle', error: null });
  }, []);

  return { ...state, write, reset };
}
