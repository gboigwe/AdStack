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

/** Match a response against ok/err handlers */
export function matchResponse<T, E, R>(
  result: ClarityResponse<T, E>,
  handlers: ResultHandler<T, E, R>
): R {
  if (result.type === 'ok') return handlers.ok(result.value);
  return handlers.err(result.value);
}

/** Map over the OK value of a response */
export function mapOk<T, U, E>(
  result: ClarityResponse<T, E>,
  fn: (value: T) => U
): ClarityResponse<U, E> {
  if (result.type === 'ok') return makeOk(fn(result.value));
  return result as unknown as ErrResult<E>;
}

/** Map over the Err value of a response */
export function mapErr<T, E, F>(
  result: ClarityResponse<T, E>,
  fn: (error: E) => F
): ClarityResponse<T, F> {
  if (result.type === 'err') return makeErr(fn(result.value));
  return result as unknown as OkResult<T>;
}

/** FlatMap over the OK value of a response */
export function flatMapOk<T, U, E>(
  result: ClarityResponse<T, E>,
  fn: (value: T) => ClarityResponse<U, E>
): ClarityResponse<U, E> {
  if (result.type === 'ok') return fn(result.value);
  return result as unknown as ErrResult<E>;
}
