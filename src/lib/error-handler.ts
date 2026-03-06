/**
 * Error Handling for Stacks.js v7+ SDK
 * Consistent error parsing and user-friendly messages
 */

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

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
  originalError?: unknown;
  details?: Record<string, unknown>;
  severity?: ErrorSeverity;
}

/**
 * Parse any error into a structured StacksError with code, message, and severity
 * @param error - The raw error from Stacks SDK, network, or wallet operations
 * @returns Structured StacksError with categorized code and user-friendly message
 */
export function parseStacksError(error: unknown): StacksError {
  if (!error) {
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
    };
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Wallet errors
  if (errorMessage.includes('not signed in') || errorMessage.includes('User not signed in')) {
    return {
      code: ErrorCode.WALLET_NOT_CONNECTED,
      message: 'Please connect your wallet to continue',
      originalError: error,
      severity: ErrorSeverity.MEDIUM,
    };
  }

  if (errorMessage.includes('user rejected') || errorMessage.includes('User cancelled')) {
    return {
      code: ErrorCode.USER_REJECTED,
      message: 'Transaction was rejected by user',
      originalError: error,
      severity: ErrorSeverity.LOW,
    };
  }

  if (errorMessage.includes('insufficient') && errorMessage.includes('funds')) {
    return {
      code: ErrorCode.INSUFFICIENT_FUNDS,
      message: 'Insufficient STX balance for this transaction',
      originalError: error,
      severity: ErrorSeverity.MEDIUM,
    };
  }

  // Transaction errors
  if (errorMessage.includes('post condition') || errorMessage.includes('PostCondition')) {
    return {
      code: ErrorCode.POST_CONDITION_FAILED,
      message: 'Transaction safety check failed. Your funds are safe.',
      originalError: error,
      severity: ErrorSeverity.HIGH,
    };
  }

  if (errorMessage.includes('broadcast')) {
    return {
      code: ErrorCode.TX_BROADCAST_FAILED,
      message: 'Failed to broadcast transaction to network',
      originalError: error,
      severity: ErrorSeverity.HIGH,
    };
  }

  if (errorMessage.includes('abort_by_response')) {
    return {
      code: ErrorCode.TX_REJECTED,
      message: 'Transaction was rejected by the contract',
      originalError: error,
      severity: ErrorSeverity.HIGH,
    };
  }

  // Contract errors
  if (errorMessage.includes('err-not-found')) {
    return {
      code: ErrorCode.CAMPAIGN_NOT_FOUND,
      message: 'Campaign not found',
      originalError: error,
      severity: ErrorSeverity.LOW,
    };
  }

  if (errorMessage.includes('err-unauthorized') || errorMessage.includes('err-owner-only')) {
    return {
      code: ErrorCode.UNAUTHORIZED,
      message: 'You are not authorized to perform this action',
      originalError: error,
      severity: ErrorSeverity.CRITICAL,
    };
  }

  if (errorMessage.includes('err-insufficient-balance')) {
    return {
      code: ErrorCode.INSUFFICIENT_BALANCE,
      message: 'Insufficient balance for this operation',
      originalError: error,
      severity: ErrorSeverity.MEDIUM,
    };
  }

  if (errorMessage.includes('err-expired')) {
    return {
      code: ErrorCode.CAMPAIGN_EXPIRED,
      message: 'Campaign has expired',
      originalError: error,
      severity: ErrorSeverity.LOW,
    };
  }

  if (errorMessage.includes('err-already-exists')) {
    return {
      code: ErrorCode.ALREADY_EXISTS,
      message: 'This item already exists',
      originalError: error,
      severity: ErrorSeverity.LOW,
    };
  }

  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      code: ErrorCode.NETWORK_ERROR,
      message: 'Network error. Please check your connection.',
      originalError: error,
      severity: ErrorSeverity.HIGH,
    };
  }

  if (errorMessage.includes('timeout')) {
    return {
      code: ErrorCode.TIMEOUT,
      message: 'Request timed out. Please try again.',
      originalError: error,
      severity: ErrorSeverity.MEDIUM,
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
 * Get a user-friendly error message string from any error type
 * @param error - The raw error to extract a message from
 * @returns Human-readable error message
 */
export function getErrorMessage(error: unknown): string {
  const parsedError = parseStacksError(error);
  return parsedError.message;
}

/**
 * Determine if an error can be resolved by retrying the operation
 * @param error - The StacksError to evaluate
 * @returns True if the error is transient and should be retried
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
 * Get the severity level of an error for prioritization
 * @param error - The StacksError to evaluate
 * @returns The ErrorSeverity level
 */
export function getErrorSeverity(error: StacksError): ErrorSeverity {
  if (error.severity) return error.severity;
  const criticalCodes = [ErrorCode.UNAUTHORIZED, ErrorCode.CONTRACT_ERROR];
  const highCodes = [ErrorCode.NETWORK_ERROR, ErrorCode.TX_BROADCAST_FAILED, ErrorCode.POST_CONDITION_FAILED];
  const mediumCodes = [ErrorCode.TIMEOUT, ErrorCode.WALLET_NOT_CONNECTED, ErrorCode.INSUFFICIENT_FUNDS];
  if (criticalCodes.includes(error.code)) return ErrorSeverity.CRITICAL;
  if (highCodes.includes(error.code)) return ErrorSeverity.HIGH;
  if (mediumCodes.includes(error.code)) return ErrorSeverity.MEDIUM;
  return ErrorSeverity.LOW;
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

/** Recovery action suggested to the user for a specific error */
export type ErrorRecoveryAction = {
  label: string;
  action: 'retry' | 'connect_wallet' | 'increase_funds' | 'contact_support' | 'dismiss';
  description: string;
};

/**
 * Create custom error
 */
export function createStacksError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): StacksError {
  return {
    code,
    message,
    details,
  };
}

/**
 * Get suggested recovery action for an error
 * @param error - The StacksError to get recovery for
 * @returns ErrorRecoveryAction with label, action type, and description
 */
export function getRecoveryAction(error: StacksError): ErrorRecoveryAction {
  switch (error.code) {
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.TIMEOUT:
    case ErrorCode.TX_BROADCAST_FAILED:
      return { label: 'Retry', action: 'retry', description: 'Try the operation again' };
    case ErrorCode.WALLET_NOT_CONNECTED:
    case ErrorCode.WALLET_LOCKED:
      return { label: 'Connect Wallet', action: 'connect_wallet', description: 'Connect your wallet to continue' };
    case ErrorCode.INSUFFICIENT_FUNDS:
    case ErrorCode.INSUFFICIENT_BALANCE:
      return { label: 'Add Funds', action: 'increase_funds', description: 'Add more STX to your wallet' };
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.CONTRACT_ERROR:
      return { label: 'Contact Support', action: 'contact_support', description: 'This error requires assistance' };
    default:
      return { label: 'Dismiss', action: 'dismiss', description: 'Close this error message' };
  }
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
