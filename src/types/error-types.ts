// Typed error categories for Stacks integration
export type ErrorCategory = 'network' | 'wallet' | 'contract' | 'validation' | 'auth' | 'unknown';

export interface StacksError {
  category: ErrorCategory;
  code: number;
  message: string;
  raw?: unknown;
}

export function makeError(category: ErrorCategory, code: number, message: string, raw?: unknown): StacksError {
  return { category, code, message, raw };
}

export const ERROR_CODES = {
  NETWORK_TIMEOUT: 1001,
  NETWORK_UNREACHABLE: 1002,
  WALLET_NOT_FOUND: 2001,
  WALLET_REJECTED: 2002,
  CONTRACT_CALL_FAILED: 3001,
  CONTRACT_ABORT: 3002,
  VALIDATION_FAILED: 4001,
  AUTH_REQUIRED: 5001,
} as const;
