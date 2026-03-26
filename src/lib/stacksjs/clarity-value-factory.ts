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

export function intCV(value: bigint | number | string): IntCV {
  return { type: 'int', value: BigInt(value) };
}

export function boolCV(value: boolean): BoolCV {
  return { type: 'bool', value };
}

export const trueCV = (): BoolCV => boolCV(true);
export const falseCV = (): BoolCV => boolCV(false);

export function noneCV(): NoneCV {
  return { type: 'none' };
}

export function someCV<T extends ClarityValue>(value: T): SomeCV<T> {
  return { type: 'some', value };
}

export function bufferCV(buffer: Uint8Array): BufferCV {
  return { type: 'buffer', buffer };
}

export function bufferCVFromString(hex: string): BufferCV {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return bufferCV(bytes);
}

export function stringAsciiCV(data: string): StringAsciiCV {
  return { type: 'string-ascii', data };
}

export function stringUtf8CV(data: string): StringUtf8CV {
  return { type: 'string-utf8', data };
}

export function standardPrincipalCV(address: string): StandardPrincipalCV {
  return { type: 'standard_principal', address };
}

export function contractPrincipalCV(address: string, contractName: string): ContractPrincipalCV {
  return { type: 'contract_principal', address, contractName };
}

export function principalCV(addressOrContractId: string): PrincipalCV {
  if (addressOrContractId.includes('.')) {
    const [address, name] = addressOrContractId.split('.');
    return contractPrincipalCV(address, name);
  }
  return standardPrincipalCV(addressOrContractId);
}

export function listCV<T extends ClarityValue>(list: T[]): ListCV<T> {
  return { type: 'list', list };
}

export function tupleCV<T extends Record<string, ClarityValue>>(data: T): TupleCV<T> {
  return { type: 'tuple', data };
}
