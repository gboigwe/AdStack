import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTransactionStore } from '@/store/transaction-store';

describe('transaction-store', () => {
  beforeEach(() => {
    useTransactionStore.setState({ transactions: [] });
  });

  it('starts with an empty transaction list', () => {
    expect(useTransactionStore.getState().transactions).toEqual([]);
  });

  it('addTransaction prepends a new submitted transaction', () => {
    useTransactionStore.getState().addTransaction('0xabc', 'Create Campaign');

    const txs = useTransactionStore.getState().transactions;
    expect(txs).toHaveLength(1);
    expect(txs[0].txId).toBe('0xabc');
    expect(txs[0].label).toBe('Create Campaign');
    expect(txs[0].status).toBe('submitted');
    expect(txs[0].submittedAt).toBeGreaterThan(0);
  });

  it('adds newest transactions first', () => {
    useTransactionStore.getState().addTransaction('0x1', 'First');
    useTransactionStore.getState().addTransaction('0x2', 'Second');

    const txs = useTransactionStore.getState().transactions;
    expect(txs[0].txId).toBe('0x2');
    expect(txs[1].txId).toBe('0x1');
  });

  it('caps transactions at 50', () => {
    for (let i = 0; i < 55; i++) {
      useTransactionStore.getState().addTransaction(`0x${i}`, `Tx ${i}`);
    }

    expect(useTransactionStore.getState().transactions).toHaveLength(50);
  });

  it('updateStatus changes the status of a transaction', () => {
    useTransactionStore.getState().addTransaction('0xabc', 'Vote');
    useTransactionStore.getState().updateStatus('0xabc', 'confirmed');

    const tx = useTransactionStore.getState().transactions[0];
    expect(tx.status).toBe('confirmed');
    expect(tx.confirmedAt).toBeGreaterThan(0);
  });

  it('updateStatus sets error on failure', () => {
    useTransactionStore.getState().addTransaction('0xabc', 'Fund');
    useTransactionStore.getState().updateStatus('0xabc', 'failed', 'Insufficient balance');

    const tx = useTransactionStore.getState().transactions[0];
    expect(tx.status).toBe('failed');
    expect(tx.error).toBe('Insufficient balance');
  });

  it('updateStatus does not set confirmedAt for non-confirmed status', () => {
    useTransactionStore.getState().addTransaction('0xabc', 'Fund');
    useTransactionStore.getState().updateStatus('0xabc', 'failed');

    const tx = useTransactionStore.getState().transactions[0];
    expect(tx.confirmedAt).toBeUndefined();
  });

  it('clearCompleted removes confirmed and failed transactions', () => {
    useTransactionStore.getState().addTransaction('0x1', 'A');
    useTransactionStore.getState().addTransaction('0x2', 'B');
    useTransactionStore.getState().addTransaction('0x3', 'C');

    useTransactionStore.getState().updateStatus('0x1', 'confirmed');
    useTransactionStore.getState().updateStatus('0x3', 'failed');

    useTransactionStore.getState().clearCompleted();

    const txs = useTransactionStore.getState().transactions;
    expect(txs).toHaveLength(1);
    expect(txs[0].txId).toBe('0x2');
  });

  it('getPending returns only submitted transactions', () => {
    useTransactionStore.getState().addTransaction('0x1', 'A');
    useTransactionStore.getState().addTransaction('0x2', 'B');
    useTransactionStore.getState().updateStatus('0x1', 'confirmed');

    const pending = useTransactionStore.getState().getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].txId).toBe('0x2');
  });

  it('updateStatus does not modify other transactions', () => {
    useTransactionStore.getState().addTransaction('0x1', 'A');
    useTransactionStore.getState().addTransaction('0x2', 'B');

    useTransactionStore.getState().updateStatus('0x1', 'confirmed');

    const txs = useTransactionStore.getState().transactions;
    expect(txs.find((t) => t.txId === '0x2')?.status).toBe('submitted');
  });
});
