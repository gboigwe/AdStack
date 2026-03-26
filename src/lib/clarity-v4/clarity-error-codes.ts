// Clarity v4 Standard Error Codes

export const ERR_UNAUTHORIZED = 100n;
export const ERR_NOT_FOUND = 101n;
export const ERR_ALREADY_EXISTS = 102n;
export const ERR_INVALID_AMOUNT = 103n;
export const ERR_INSUFFICIENT_BALANCE = 104n;

export const ERR_EXPIRED = 200n;
export const ERR_NOT_STARTED = 201n;
export const ERR_PAUSED = 202n;
export const ERR_ALREADY_CLAIMED = 203n;
export const ERR_COOLDOWN_ACTIVE = 204n;

export const ERR_OVERFLOW = 300n;
export const ERR_UNDERFLOW = 301n;
export const ERR_DIVIDE_BY_ZERO = 302n;
export const ERR_OUT_OF_BOUNDS = 303n;

export const ERR_INVALID_PRINCIPAL = 400n;
export const ERR_INVALID_CONTRACT = 401n;
export const ERR_INVALID_TOKEN = 402n;
export const ERR_INVALID_PARAMETER = 403n;

export type ClarityErrorCode = bigint;

export function errorCodeToString(code: ClarityErrorCode): string {
  const known: Record<string, string> = {
    '100': 'UNAUTHORIZED',
    '101': 'NOT_FOUND',
    '102': 'ALREADY_EXISTS',
    '103': 'INVALID_AMOUNT',
    '104': 'INSUFFICIENT_BALANCE',
    '200': 'EXPIRED',
    '201': 'NOT_STARTED',
    '300': 'OVERFLOW',
    '400': 'INVALID_PRINCIPAL',
  };
  return known[code.toString()] ?? `UNKNOWN_ERROR(${code})`;
}

export function isAuthError(code: ClarityErrorCode): boolean {
  return code >= 100n && code < 200n;
}

export function isLifecycleError(code: ClarityErrorCode): boolean {
  return code >= 200n && code < 300n;
}

export function isArithmeticError(code: ClarityErrorCode): boolean {
  return code >= 300n && code < 400n;
}
