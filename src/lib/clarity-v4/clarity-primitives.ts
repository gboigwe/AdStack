// Clarity v4 Primitive Types and Validators

export type ClarityUint = { type: 'uint'; value: bigint };

export type ClarityInt = { type: 'int'; value: bigint };

export type ClarityBool = { type: 'bool'; value: boolean };

export type ClarityPrincipal = { type: 'principal'; value: string };

export type ClarityOptional<T> = { type: 'optional'; value: T | null };

export type ClarityNone = { type: 'none' };

export type ClaritySome<T> = { type: 'some'; value: T };

export type ClarityResponseOk<T> = { type: 'ok'; value: T };

export type ClarityResponseErr<E> = { type: 'err'; value: E };

export type ClarityResponse<T, E> = ClarityResponseOk<T> | ClarityResponseErr<E>;

export type ClarityBuffer = { type: 'buffer'; value: Uint8Array };

export type ClarityStringAscii = { type: 'string-ascii'; value: string };

export type ClarityStringUtf8 = { type: 'string-utf8'; value: string };

export const MAX_UINT128 = BigInt('340282366920938463463374607431768211455');

export const MIN_INT128 = BigInt('-170141183460469231731687303715884105728');

export const MAX_INT128 = BigInt('170141183460469231731687303715884105727');
