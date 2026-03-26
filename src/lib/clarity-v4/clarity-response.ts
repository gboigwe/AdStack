// Clarity v4 Response Type Utilities
import type { ClarityResponse, ClarityResponseOk, ClarityResponseErr } from './clarity-primitives';

export type OkResult<T> = ClarityResponseOk<T>;
