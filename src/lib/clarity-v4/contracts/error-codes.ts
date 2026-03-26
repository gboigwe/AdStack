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
