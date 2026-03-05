/**
 * Error Handling for Stacks.js v7+ SDK
 * Consistent error parsing and user-friendly messages
 */

export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  OFFLINE = 'OFFLINE',

  // Wallet errors
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  WALLET_LOCKED = 'WALLET_LOCKED',
  USER_REJECTED = 'USER_REJECTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',

  // Transaction errors
  TX_BROADCAST_FAILED = 'TX_BROADCAST_FAILED',
  TX_REJECTED = 'TX_REJECTED',
  POST_CONDITION_FAILED = 'POST_CONDITION_FAILED',
  INVALID_ARGS = 'INVALID_ARGS',
  CONTRACT_ERROR = 'CONTRACT_ERROR',

  // Contract-specific errors
  CAMPAIGN_NOT_FOUND = 'CAMPAIGN_NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  CAMPAIGN_EXPIRED = 'CAMPAIGN_EXPIRED',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface StacksError {
  code: ErrorCode;
  message: string;
  originalError?: any;
  details?: Record<string, any>;
}

/**
 * Parse Stacks SDK error to user-friendly message
 */
export function parseStacksError(error: any): StacksError {
  if (!error) {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
    };
  }

  const errorMessage = error.message || error.toString();

  // Wallet errors
  if (errorMessage.includes('not signed in') || errorMessage.includes('User not signed in')) {
    return {
      code: ErrorCode.WALLET_NOT_CONNECTED,
      message: 'Please connect your wallet to continue',
      originalError: error,
    };
  }

  if (errorMessage.includes('user rejected') || errorMessage.includes('User cancelled')) {
    return {
      code: ErrorCode.USER_REJECTED,
      message: 'Transaction was rejected by user',
      originalError: error,
    };
  }

  if (errorMessage.includes('insufficient') && errorMessage.includes('funds')) {
    return {
      code: ErrorCode.INSUFFICIENT_FUNDS,
      message: 'Insufficient STX balance for this transaction',
      originalError: error,
    };
  }

  // Transaction errors
  if (errorMessage.includes('post condition') || errorMessage.includes('PostCondition')) {
    return {
      code: ErrorCode.POST_CONDITION_FAILED,
      message: 'Transaction safety check failed. Your funds are safe.',
      originalError: error,
    };
  }

  if (errorMessage.includes('broadcast')) {
    return {
      code: ErrorCode.TX_BROADCAST_FAILED,
      message: 'Failed to broadcast transaction to network',
      originalError: error,
    };
  }

  if (errorMessage.includes('abort_by_response')) {
    return {
      code: ErrorCode.TX_REJECTED,
      message: 'Transaction was rejected by the contract',
      originalError: error,
    };
  }

  // Contract errors
  if (errorMessage.includes('err-not-found')) {
    return {
      code: ErrorCode.CAMPAIGN_NOT_FOUND,
      message: 'Campaign not found',
      originalError: error,
    };
  }

  if (errorMessage.includes('err-unauthorized') || errorMessage.includes('err-owner-only')) {
    return {
      code: ErrorCode.UNAUTHORIZED,
      message: 'You are not authorized to perform this action',
      originalError: error,
    };
  }

  if (errorMessage.includes('err-insufficient-balance')) {
    return {
      code: ErrorCode.INSUFFICIENT_BALANCE,
      message: 'Insufficient balance for this operation',
      originalError: error,
    };
  }

  if (errorMessage.includes('err-expired')) {
    return {
      code: ErrorCode.CAMPAIGN_EXPIRED,
      message: 'Campaign has expired',
      originalError: error,
    };
  }

  if (errorMessage.includes('err-already-exists')) {
    return {
      code: ErrorCode.ALREADY_EXISTS,
      message: 'This item already exists',
      originalError: error,
    };
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      code: ErrorCode.NETWORK_ERROR,
      message: 'Network error. Please check your connection.',
      originalError: error,
    };
  }

  if (errorMessage.includes('timeout')) {
    return {
      code: ErrorCode.TIMEOUT,
      message: 'Request timed out. Please try again.',
      originalError: error,
    };
  }

  // Default unknown error
  return {
    code: ErrorCode.UNKNOWN_ERROR,
    message: errorMessage || 'An unexpected error occurred',
    originalError: error,
  };
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: any): string {
  const parsedError = parseStacksError(error);
  return parsedError.message;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: StacksError): boolean {
  return [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TIMEOUT,
    ErrorCode.TX_BROADCAST_FAILED,
  ].includes(error.code);
}

/**
 * Check if error requires wallet connection
 */
export function requiresWalletConnection(error: StacksError): boolean {
  return [ErrorCode.WALLET_NOT_CONNECTED, ErrorCode.WALLET_LOCKED].includes(
    error.code
  );
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: StacksError): string {
  return JSON.stringify(
    {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
    },
    null,
    2
  );
}

/**
 * Log error to console (development) or service (production)
 */
export function logError(error: StacksError, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context || 'StacksError'}]`, formatErrorForLogging(error));
    if (error.originalError) {
      console.error('Original error:', error.originalError);
    }
  } else {
    // In production, send to error tracking service
    // Example: Sentry, LogRocket, etc.
    // sendToErrorTrackingService(error, context);
  }
}

/**
 * Create custom error
 */
export function createStacksError(
  code: ErrorCode,
  message: string,
  details?: Record<string, any>
): StacksError {
  return {
    code,
    message,
    details,
  };
}

/**
 * Handle async errors with try-catch wrapper
 */
export async function handleAsync<T>(
  promise: Promise<T>,
  context?: string
): Promise<[T | null, StacksError | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const parsedError = parseStacksError(error);
    if (context) {
      logError(parsedError, context);
    }
    return [null, parsedError];
  }
}
