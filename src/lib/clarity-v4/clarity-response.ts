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

/** Propagate an error from a response */
export function propagateError<T, E>(result: ClarityResponse<T, E>): ErrResult<E> | null {
  if (result.type === 'err') return result;
  return null;
}

/** Try to execute a function and wrap result in a response */
export function tryResponse<T>(fn: () => T): ClarityResponse<T, string> {
  try {
    return makeOk(fn());
  } catch (e) {
    return makeErr(e instanceof Error ? e.message : String(e));
  }
}

/** Combine multiple responses into one */
export function combineResponses<T, E>(
  results: ClarityResponse<T, E>[]
): ClarityResponse<T[], E> {
  const values: T[] = [];
  for (const r of results) {
    if (r.type === 'err') return r;
    values.push(r.value);
  }
  return makeOk(values);
}

/** Convert a nullable value to a response */
export function fromNullable<T, E>(value: T | null | undefined, errorValue: E): ClarityResponse<T, E> {
  if (value == null) return makeErr(errorValue);
  return makeOk(value);
}

/** Convert a Promise to a ClarityResponse */
export async function fromPromise<T>(promise: Promise<T>): Promise<ClarityResponse<T, string>> {
  try {
    return makeOk(await promise);
  } catch (e) {
    return makeErr(e instanceof Error ? e.message : String(e));
  }
}

/** Tap into a response for side effects (ok branch) */
export function tapOk<T, E>(result: ClarityResponse<T, E>, fn: (v: T) => void): ClarityResponse<T, E> {
  if (result.type === 'ok') fn(result.value);
  return result;
}

/** Tap into a response for side effects (err branch) */
export function tapErr<T, E>(result: ClarityResponse<T, E>, fn: (e: E) => void): ClarityResponse<T, E> {
  if (result.type === 'err') fn(result.value);
  return result;
}

/** Swap ok and err in a response */
export function swapResponse<T, E>(result: { type: 'ok'; value: T } | { type: 'err'; value: E }): { type: 'ok'; value: E } | { type: 'err'; value: T } {
  if (result.type === 'ok') return makeErr(result.value) as unknown as { type: 'ok'; value: E };
  return makeOk(result.value) as unknown as { type: 'err'; value: T };
}
