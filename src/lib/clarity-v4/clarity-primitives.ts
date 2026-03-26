// Clarity v4 Primitive Types and Validators

export type ClarityUint = { type: 'uint'; value: bigint };

export type ClarityInt = { type: 'int'; value: bigint };

export type ClarityBool = { type: 'bool'; value: boolean };

export type ClarityPrincipal = { type: 'principal'; value: string };

export type ClarityOptional<T> = { type: 'optional'; value: T | null };

export type ClarityNone = { type: 'none' };

export type ClaritySome<T> = { type: 'some'; value: T };
