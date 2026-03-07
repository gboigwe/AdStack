import { create } from 'zustand';

export type TxStatus = 'pending' | 'submitted' | 'confirmed' | 'failed';

export interface TrackedTransaction {
  txId: string;
  label: string;
  status: TxStatus;
  submittedAt: number;
  confirmedAt?: number;
  error?: string;
}

interface TransactionState {
  transactions: TrackedTransaction[];
  addTransaction: (txId: string, label: string) => void;
  updateStatus: (txId: string, status: TxStatus, error?: string) => void;
  clearCompleted: () => void;
  getPending: () => TrackedTransaction[];
}

/**
 * Zustand store for tracking in-flight and recent contract transactions.
 * Keeps a short history of submitted transactions so the UI can show
 * progress toasts and confirmation feedback.
 */
export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],

  addTransaction: (txId, label) =>
    set((state) => ({
      transactions: [
        {
          txId,
          label,
          status: 'submitted',
          submittedAt: Date.now(),
        },
        ...state.transactions,
      ].slice(0, 50), // keep last 50
    })),

  updateStatus: (txId, status, error) =>
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.txId === txId
          ? {
              ...tx,
              status,
              error,
              confirmedAt: status === 'confirmed' ? Date.now() : tx.confirmedAt,
            }
          : tx,
      ),
    })),

  clearCompleted: () =>
    set((state) => ({
      transactions: state.transactions.filter(
        (tx) => tx.status === 'submitted' || tx.status === 'pending',
      ),
    })),

  getPending: () =>
    get().transactions.filter((tx) => tx.status === 'submitted'),
}));
