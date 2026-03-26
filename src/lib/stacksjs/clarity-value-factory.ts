// Stacks.js SDK ClarityValue factory functions

export type CvType = 'uint' | 'int' | 'bool' | 'principal' | 'buffer' | 'string-ascii' | 'string-utf8' | 'list' | 'tuple' | 'optional' | 'response-ok' | 'response-err' | 'none' | 'some';

export type UintCV = { type: 'uint'; value: bigint };
export type IntCV = { type: 'int'; value: bigint };
export type BoolCV = { type: 'bool'; value: boolean };
export type NoneCV = { type: 'none' };
export type SomeCV<T> = { type: 'some'; value: T };
export type BufferCV = { type: 'buffer'; buffer: Uint8Array };
export type StringAsciiCV = { type: 'string-ascii'; data: string };
export type StringUtf8CV = { type: 'string-utf8'; data: string };
export type StandardPrincipalCV = { type: 'standard_principal'; address: string };
export type ContractPrincipalCV = { type: 'contract_principal'; address: string; contractName: string };
export type PrincipalCV = StandardPrincipalCV | ContractPrincipalCV;
export type ListCV<T> = { type: 'list'; list: T[] };
export type TupleCV<T extends Record<string, ClarityValue> = Record<string, ClarityValue>> = { type: 'tuple'; data: T };
export type ResponseOkCV<T> = { type: 'ok'; value: T };
export type ResponseErrCV<E> = { type: 'error'; value: E };
export type ClarityValue = UintCV | IntCV | BoolCV | NoneCV | SomeCV<ClarityValue> | BufferCV | StringAsciiCV | StringUtf8CV | PrincipalCV | ListCV<ClarityValue> | TupleCV | ResponseOkCV<ClarityValue> | ResponseErrCV<ClarityValue>;

export function uintCV(value: bigint | number | string): UintCV {
  return { type: 'uint', value: BigInt(value) };
}
