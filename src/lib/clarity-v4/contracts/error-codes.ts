// AdStack Contract Error Codes

// --- Auth errors ---
export const ERR_OWNER_ONLY = 100n;
export const ERR_ADMIN_ONLY = 101n;
export const ERR_NOT_AUTHORIZED = 102n;
export const ERR_BLACKLISTED = 103n;

// --- Campaign errors ---
export const ERR_CAMPAIGN_NOT_FOUND = 200n;
export const ERR_CAMPAIGN_INACTIVE = 201n;
export const ERR_CAMPAIGN_EXPIRED = 202n;
export const ERR_CAMPAIGN_NOT_STARTED = 203n;
export const ERR_CAMPAIGN_FULL = 204n;
export const ERR_CAMPAIGN_ALREADY_EXISTS = 205n;

// --- Budget errors ---
export const ERR_INSUFFICIENT_BUDGET = 300n;
export const ERR_BUDGET_EXHAUSTED = 301n;
export const ERR_INVALID_BUDGET_AMOUNT = 302n;
export const ERR_PAYOUT_EXCEEDS_BUDGET = 303n;

// --- Publisher errors ---
export const ERR_PUBLISHER_NOT_REGISTERED = 400n;
export const ERR_PUBLISHER_UNVERIFIED = 401n;
export const ERR_PUBLISHER_BANNED = 402n;
export const ERR_PAYOUT_ALREADY_CLAIMED = 403n;
export const ERR_PAYOUT_COOLDOWN = 404n;

// --- Governance errors ---
export const ERR_PROPOSAL_NOT_FOUND = 500n;
export const ERR_ALREADY_VOTED = 501n;
export const ERR_VOTING_CLOSED = 502n;
export const ERR_INSUFFICIENT_VOTING_POWER = 503n;
export const ERR_PROPOSAL_NOT_PASSED = 504n;

// --- Token errors ---
export const ERR_INVALID_TOKEN = 600n;
export const ERR_TOKEN_NOT_WHITELISTED = 601n;
export const ERR_INSUFFICIENT_TOKEN_BALANCE = 602n;
export const ERR_TOKEN_TRANSFER_FAILED = 603n;

export type AdStackErrorCode = bigint;

export function getErrorName(code: AdStackErrorCode): string {
  const names: Record<string, string> = {
    '100': 'ERR_OWNER_ONLY',
    '101': 'ERR_ADMIN_ONLY',
    '200': 'ERR_CAMPAIGN_NOT_FOUND',
    '201': 'ERR_CAMPAIGN_INACTIVE',
    '300': 'ERR_INSUFFICIENT_BUDGET',
    '400': 'ERR_PUBLISHER_NOT_REGISTERED',
    '500': 'ERR_PROPOSAL_NOT_FOUND',
    '600': 'ERR_INVALID_TOKEN',
  };
  return names[code.toString()] ?? `UNKNOWN_ERROR(${code})`;
}

export function isAuthError(code: AdStackErrorCode): boolean {
  return code >= 100n && code < 200n;
}

export function isCampaignError(code: AdStackErrorCode): boolean {
  return code >= 200n && code < 300n;
}

export function isBudgetError(code: AdStackErrorCode): boolean {
  return code >= 300n && code < 400n;
}

export function isPublisherError(code: AdStackErrorCode): boolean {
  return code >= 400n && code < 500n;
}

export function isGovernanceError(code: AdStackErrorCode): boolean {
  return code >= 500n && code < 600n;
}

export function isTokenError(code: AdStackErrorCode): boolean {
  return code >= 600n && code < 700n;
}

export const ERROR_CODE_MAP: Record<string, string> = {
  '100': 'Owner only action',
  '101': 'Admin only action',
  '102': 'Not authorized',
  '200': 'Campaign not found',
  '201': 'Campaign inactive',
  '300': 'Insufficient budget',
  '400': 'Publisher not registered',
  '500': 'Proposal not found',
  '600': 'Invalid token',
};

export function getErrorDescription(code: AdStackErrorCode): string {
  return ERROR_CODE_MAP[code.toString()] ?? 'Unknown error occurred';
}

export const ERR_NETWORK_ERROR = 900n;
export const ERR_TIMEOUT = 901n;
export const ERR_RATE_LIMITED = 902n;
export const ERR_SERVICE_UNAVAILABLE = 903n;

export const ERR_CUSTOM_1 = 1001n;

export const ERR_CUSTOM_2 = 1002n;

export const ERR_CUSTOM_3 = 1003n;

export const ERR_CUSTOM_4 = 1004n;

export const ERR_CUSTOM_5 = 1005n;

export const ERR_CUSTOM_6 = 1006n;

export const ERR_CUSTOM_7 = 1007n;

export const ERR_CUSTOM_8 = 1008n;

export const ERR_CUSTOM_9 = 1009n;

export const ERR_CUSTOM_10 = 1010n;
