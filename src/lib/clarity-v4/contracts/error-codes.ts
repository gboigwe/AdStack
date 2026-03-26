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
