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

export function useSTXTransfer(defaultParams?: Partial<STXTransferParams>) {
  const [state, setState] = useState<STXTransferState>({
    txId: null, status: 'idle', error: null,
  });

  const transfer = useCallback(async (params: STXTransferParams) => {
    const merged = { ...defaultParams, ...params };
    setState({ txId: null, status: 'pending', error: null });
    try {
      const { openSTXTransfer } = await import('@stacks/connect');
      await openSTXTransfer({
        recipient: merged.recipient!,
        amount: merged.amount!,
        memo: merged.memo,
        network: merged.network === 'testnet'
          ? new (await import('@stacks/network')).StacksTestnet()
          : new (await import('@stacks/network')).StacksMainnet(),
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
  }, [defaultParams]);

  const reset = useCallback(() => {
    setState({ txId: null, status: 'idle', error: null });
  }, []);

  return { ...state, transfer, reset };
}
