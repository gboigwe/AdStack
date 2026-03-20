import { describe, it, expect } from 'vitest';
import {
  parseStacksError,
  getErrorMessage,
  isRetryableError,
  requiresWalletConnection,
  getRecoverySuggestions,
  createStacksError,
  handleAsync,
  ErrorCode,
} from '@/lib/error-handler';

describe('parseStacksError', () => {
  it('returns UNKNOWN_ERROR for falsy input', () => {
    expect(parseStacksError(null).code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(parseStacksError(undefined).code).toBe(ErrorCode.UNKNOWN_ERROR);
  });

  it('parses wallet-not-installed errors', () => {
    const result = parseStacksError(new Error('provider not found'));
    expect(result.code).toBe(ErrorCode.WALLET_NOT_CONNECTED);
  });

  it('parses user-rejected errors', () => {
    const result = parseStacksError('user rejected');
    expect(result.code).toBe(ErrorCode.USER_REJECTED);
  });

  it('parses insufficient-funds errors', () => {
    const result = parseStacksError(new Error('insufficient funds'));
    expect(result.code).toBe(ErrorCode.INSUFFICIENT_FUNDS);
  });

  it('parses post-condition failures', () => {
    const result = parseStacksError(new Error('post condition failed'));
    expect(result.code).toBe(ErrorCode.POST_CONDITION_FAILED);
  });

  it('parses broadcast failures', () => {
    const result = parseStacksError(new Error('broadcast error'));
    expect(result.code).toBe(ErrorCode.TX_BROADCAST_FAILED);
  });

  it('parses contract rejection (abort_by_response)', () => {
    const result = parseStacksError(new Error('abort_by_response'));
    expect(result.code).toBe(ErrorCode.TX_REJECTED);
  });

  it('parses contract-specific error codes', () => {
    expect(parseStacksError('err-not-found').code).toBe(ErrorCode.CAMPAIGN_NOT_FOUND);
    expect(parseStacksError('err-unauthorized').code).toBe(ErrorCode.UNAUTHORIZED);
    expect(parseStacksError('err-insufficient-balance').code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
    expect(parseStacksError('err-expired').code).toBe(ErrorCode.CAMPAIGN_EXPIRED);
    expect(parseStacksError('err-already-exists').code).toBe(ErrorCode.ALREADY_EXISTS);
  });

  it('parses network errors', () => {
    expect(parseStacksError('network failure').code).toBe(ErrorCode.NETWORK_ERROR);
    expect(parseStacksError('fetch failed').code).toBe(ErrorCode.NETWORK_ERROR);
  });

  it('parses timeout errors', () => {
    expect(parseStacksError('request timeout').code).toBe(ErrorCode.TIMEOUT);
  });

  it('falls back to UNKNOWN_ERROR with original message', () => {
    const result = parseStacksError(new Error('something weird'));
    expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(result.message).toBe('something weird');
  });

  it('preserves originalError reference', () => {
    const original = new Error('test');
    const result = parseStacksError(original);
    expect(result.originalError).toBe(original);
  });
});

describe('getErrorMessage', () => {
  it('returns the parsed message', () => {
    expect(getErrorMessage('user rejected')).toBe('Transaction was rejected by user');
  });
});

describe('isRetryableError', () => {
  it('returns true for retryable codes', () => {
    expect(isRetryableError({ code: ErrorCode.NETWORK_ERROR, message: '' })).toBe(true);
    expect(isRetryableError({ code: ErrorCode.TIMEOUT, message: '' })).toBe(true);
    expect(isRetryableError({ code: ErrorCode.TX_BROADCAST_FAILED, message: '' })).toBe(true);
  });

  it('returns false for non-retryable codes', () => {
    expect(isRetryableError({ code: ErrorCode.USER_REJECTED, message: '' })).toBe(false);
    expect(isRetryableError({ code: ErrorCode.UNAUTHORIZED, message: '' })).toBe(false);
  });
});

describe('requiresWalletConnection', () => {
  it('returns true for wallet-related codes', () => {
    expect(requiresWalletConnection({ code: ErrorCode.WALLET_NOT_CONNECTED, message: '' })).toBe(true);
    expect(requiresWalletConnection({ code: ErrorCode.WALLET_LOCKED, message: '' })).toBe(true);
  });

  it('returns false for other codes', () => {
    expect(requiresWalletConnection({ code: ErrorCode.NETWORK_ERROR, message: '' })).toBe(false);
  });
});

describe('getRecoverySuggestions', () => {
  it('suggests connect-wallet for WALLET_NOT_CONNECTED', () => {
    const suggestions = getRecoverySuggestions(ErrorCode.WALLET_NOT_CONNECTED);
    expect(suggestions[0].action).toBe('connect-wallet');
  });

  it('suggests retry for USER_REJECTED', () => {
    const suggestions = getRecoverySuggestions(ErrorCode.USER_REJECTED);
    expect(suggestions[0].action).toBe('retry');
  });

  it('suggests dismiss for POST_CONDITION_FAILED', () => {
    const suggestions = getRecoverySuggestions(ErrorCode.POST_CONDITION_FAILED);
    expect(suggestions[0].action).toBe('dismiss');
  });

  it('falls back to dismiss for unknown codes', () => {
    const suggestions = getRecoverySuggestions(ErrorCode.UNKNOWN_ERROR);
    expect(suggestions[0].action).toBe('dismiss');
  });
});

describe('createStacksError', () => {
  it('creates a StacksError with given fields', () => {
    const err = createStacksError(ErrorCode.TIMEOUT, 'timed out', { url: '/api' });
    expect(err.code).toBe(ErrorCode.TIMEOUT);
    expect(err.message).toBe('timed out');
    expect(err.details).toEqual({ url: '/api' });
  });
});

describe('handleAsync', () => {
  it('returns [data, null] on success', async () => {
    const [data, err] = await handleAsync(Promise.resolve(42));
    expect(data).toBe(42);
    expect(err).toBeNull();
  });

  it('returns [null, StacksError] on failure', async () => {
    const [data, err] = await handleAsync(Promise.reject(new Error('timeout')));
    expect(data).toBeNull();
    expect(err).not.toBeNull();
    expect(err!.code).toBe(ErrorCode.TIMEOUT);
  });
});
