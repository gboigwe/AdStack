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

/** Create an Err response */
export function makeErr<E>(error: E): ErrResult<E> {
  return { type: 'err', value: error };
}

/** Check if a response is OK */
export function isOk<T, E>(result: ClarityResponse<T, E>): result is OkResult<T> {
  return result.type === 'ok';
}

/** Check if a response is Err */
export function isErr<T, E>(result: ClarityResponse<T, E>): result is ErrResult<E> {
  return result.type === 'err';
}

/** Unwrap an OK response, throw if Err */
export function unwrapOk<T, E>(result: ClarityResponse<T, E>): T {
  if (result.type !== 'ok') throw new Error('Called unwrapOk on an Err value');
  return result.value;
}

/** Unwrap an Err response, throw if Ok */
export function unwrapErr<T, E>(result: ClarityResponse<T, E>): E {
  if (result.type !== 'err') throw new Error('Called unwrapErr on an Ok value');
  return result.value;
}

/** Unwrap OK or return a fallback */
export function unwrapOr<T, E>(result: ClarityResponse<T, E>, fallback: T): T {
  return result.type === 'ok' ? result.value : fallback;
}
