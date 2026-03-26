// Clarity v4 Response Type Utilities
import type { ClarityResponse, ClarityResponseOk, ClarityResponseErr } from './clarity-primitives';

export type OkResult<T> = ClarityResponseOk<T>;

export type ErrResult<E> = ClarityResponseErr<E>;

export type ResultHandler<T, E, R> = {
  ok: (value: T) => R;
  err: (error: E) => R;
};

/** Create an OK response */
export function makeOk<T>(value: T): OkResult<T> {
  return { type: 'ok', value };
}
