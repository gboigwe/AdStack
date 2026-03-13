import { describe, it, expect, vi } from 'vitest';
import {
  isStxBalance,
  isApiTransaction,
  isTransactionList,
  isBlockInfo,
  isReadOnlyResult,
  validateResponse,
} from '@/lib/api-guards';

describe('isStxBalance', () => {
  it('accepts a valid StxBalance object', () => {
    expect(
      isStxBalance({
        balance: '1000000',
        total_sent: '500000',
        total_received: '1500000',
        lock_tx_id: '',
        locked: '0',
        lock_height: 0,
        burnchain_lock_height: 0,
        burnchain_unlock_height: 0,
      }),
    ).toBe(true);
  });

  it('rejects when balance is missing', () => {
    expect(isStxBalance({ total_sent: '0', total_received: '0', locked: '0', lock_height: 0 })).toBe(false);
  });

  it('rejects null', () => expect(isStxBalance(null)).toBe(false));
  it('rejects string', () => expect(isStxBalance('not an object')).toBe(false));
  it('rejects array', () => expect(isStxBalance([1, 2, 3])).toBe(false));
});

describe('isApiTransaction', () => {
  const validTx = {
    tx_id: '0xabc123',
    tx_type: 'token_transfer',
    tx_status: 'success',
    block_height: 12345,
    burn_block_time: 1700000000,
    burn_block_time_iso: '2024-01-01T00:00:00Z',
    fee_rate: '200',
    sender_address: 'ST1234',
    nonce: 5,
  };

  it('accepts a valid ApiTransaction', () => {
    expect(isApiTransaction(validTx)).toBe(true);
  });

  it('rejects when tx_id is missing', () => {
    const { tx_id, ...rest } = validTx;
    expect(isApiTransaction(rest)).toBe(false);
  });

  it('rejects when block_height is a string', () => {
    expect(isApiTransaction({ ...validTx, block_height: '12345' })).toBe(false);
  });

  it('rejects undefined', () => expect(isApiTransaction(undefined)).toBe(false));
});

describe('isTransactionList', () => {
  const validTx = {
    tx_id: '0xabc',
    tx_type: 'token_transfer',
    tx_status: 'success',
    block_height: 100,
    burn_block_time: 1700000000,
    burn_block_time_iso: '',
    fee_rate: '0',
    sender_address: 'ST1234',
    nonce: 0,
  };

  it('accepts a valid TransactionList', () => {
    expect(
      isTransactionList({
        total: 10,
        limit: 20,
        offset: 0,
        results: [validTx],
      }),
    ).toBe(true);
  });

  it('accepts empty results', () => {
    expect(
      isTransactionList({ total: 0, limit: 20, offset: 0, results: [] }),
    ).toBe(true);
  });

  it('rejects when results is not an array', () => {
    expect(
      isTransactionList({ total: 0, limit: 20, offset: 0, results: 'not-array' }),
    ).toBe(false);
  });

  it('rejects when first result is invalid', () => {
    expect(
      isTransactionList({
        total: 1,
        limit: 20,
        offset: 0,
        results: [{ bad: 'data' }],
      }),
    ).toBe(false);
  });

  it('rejects missing total', () => {
    expect(isTransactionList({ limit: 20, offset: 0, results: [] })).toBe(false);
  });
});

describe('isBlockInfo', () => {
  it('accepts valid block info', () => {
    expect(isBlockInfo({ stacks_tip_height: 50000 })).toBe(true);
  });

  it('rejects when height is a string', () => {
    expect(isBlockInfo({ stacks_tip_height: '50000' })).toBe(false);
  });

  it('rejects missing field', () => {
    expect(isBlockInfo({})).toBe(false);
  });
});

describe('isReadOnlyResult', () => {
  it('accepts valid result', () => {
    expect(isReadOnlyResult({ okay: true, result: '0x0100' })).toBe(true);
  });

  it('rejects when okay is not boolean', () => {
    expect(isReadOnlyResult({ okay: 'true', result: '0x' })).toBe(false);
  });

  it('rejects when result is missing', () => {
    expect(isReadOnlyResult({ okay: true })).toBe(false);
  });
});

describe('validateResponse', () => {
  it('returns data when guard passes', () => {
    const data = { stacks_tip_height: 123 };
    expect(validateResponse(data, isBlockInfo, 'block')).toEqual(data);
  });

  it('returns undefined and warns when guard fails', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = validateResponse('bad data', isBlockInfo, 'block');
    expect(result).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(
      '[api-guards] Invalid block response:',
      'bad data',
    );
    warn.mockRestore();
  });
});
