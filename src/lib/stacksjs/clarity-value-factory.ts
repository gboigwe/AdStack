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

export function responseOkCV<T extends ClarityValue>(value: T): ResponseOkCV<T> {
  return { type: 'ok', value };
}

export function responseErrCV<E extends ClarityValue>(value: E): ResponseErrCV<E> {
  return { type: 'error', value };
}

export const isUintCV = (cv: ClarityValue): cv is UintCV => cv.type === 'uint';
export const isIntCV = (cv: ClarityValue): cv is IntCV => cv.type === 'int';
export const isBoolCV = (cv: ClarityValue): cv is BoolCV => cv.type === 'bool';
export const isNoneCV = (cv: ClarityValue): cv is NoneCV => cv.type === 'none';
export const isSomeCV = (cv: ClarityValue): cv is SomeCV<ClarityValue> => cv.type === 'some';
export const isBufferCV = (cv: ClarityValue): cv is BufferCV => cv.type === 'buffer';
export const isStringAsciiCV = (cv: ClarityValue): cv is StringAsciiCV => cv.type === 'string-ascii';
export const isStringUtf8CV = (cv: ClarityValue): cv is StringUtf8CV => cv.type === 'string-utf8';
export const isListCV = (cv: ClarityValue): cv is ListCV<ClarityValue> => cv.type === 'list';
export const isTupleCV = (cv: ClarityValue): cv is TupleCV => cv.type === 'tuple';
export const isResponseOkCV = (cv: ClarityValue): cv is ResponseOkCV<ClarityValue> => cv.type === 'ok';
export const isResponseErrCV = (cv: ClarityValue): cv is ResponseErrCV<ClarityValue> => cv.type === 'error';

// Factory helper 1
export function makeUint1(): UintCV { return uintCV(1); }

// Factory helper 2
export function makeUint2(): UintCV { return uintCV(2); }

// Factory helper 3
export function makeUint3(): UintCV { return uintCV(3); }

// Factory helper 4
export function makeUint4(): UintCV { return uintCV(4); }

// Factory helper 5
export function makeUint5(): UintCV { return uintCV(5); }

// Factory helper 6
export function makeUint6(): UintCV { return uintCV(6); }

// Factory helper 7
export function makeUint7(): UintCV { return uintCV(7); }

// Factory helper 8
export function makeUint8(): UintCV { return uintCV(8); }

// Factory helper 9
export function makeUint9(): UintCV { return uintCV(9); }

// Factory helper 10
export function makeUint10(): UintCV { return uintCV(10); }

// Factory helper 11
export function makeUint11(): UintCV { return uintCV(11); }

// Factory helper 12
export function makeUint12(): UintCV { return uintCV(12); }

// Factory helper 13
export function makeUint13(): UintCV { return uintCV(13); }

// Factory helper 14
export function makeUint14(): UintCV { return uintCV(14); }

// Factory helper 15
export function makeUint15(): UintCV { return uintCV(15); }

// Factory helper 16
export function makeUint16(): UintCV { return uintCV(16); }

// Factory helper 17
export function makeUint17(): UintCV { return uintCV(17); }

// Factory helper 18
export function makeUint18(): UintCV { return uintCV(18); }

// Factory helper 19
export function makeUint19(): UintCV { return uintCV(19); }

// Factory helper 20
export function makeUint20(): UintCV { return uintCV(20); }

// Factory helper 21
export function makeUint21(): UintCV { return uintCV(21); }

// Factory helper 22
export function makeUint22(): UintCV { return uintCV(22); }

// Factory helper 23
export function makeUint23(): UintCV { return uintCV(23); }

// Factory helper 24
export function makeUint24(): UintCV { return uintCV(24); }

// Factory helper 25
export function makeUint25(): UintCV { return uintCV(25); }

// Factory helper 26
export function makeUint26(): UintCV { return uintCV(26); }

// Factory helper 27
export function makeUint27(): UintCV { return uintCV(27); }

// Factory helper 28
export function makeUint28(): UintCV { return uintCV(28); }

// Factory helper 29
export function makeUint29(): UintCV { return uintCV(29); }

// Factory helper 30
export function makeUint30(): UintCV { return uintCV(30); }

// Factory helper 31
export function makeUint31(): UintCV { return uintCV(31); }

// Factory helper 32
export function makeUint32(): UintCV { return uintCV(32); }

// Factory helper 33
export function makeUint33(): UintCV { return uintCV(33); }

// Factory helper 34
export function makeUint34(): UintCV { return uintCV(34); }

// Factory helper 35
export function makeUint35(): UintCV { return uintCV(35); }

// Factory helper 36
export function makeUint36(): UintCV { return uintCV(36); }

// Factory helper 37
export function makeUint37(): UintCV { return uintCV(37); }

// Factory helper 38
export function makeUint38(): UintCV { return uintCV(38); }

// Factory helper 39
export function makeUint39(): UintCV { return uintCV(39); }

// Factory helper 40
export function makeUint40(): UintCV { return uintCV(40); }

// Factory helper 41
export function makeUint41(): UintCV { return uintCV(41); }

// Factory helper 42
export function makeUint42(): UintCV { return uintCV(42); }

// Factory helper 43
export function makeUint43(): UintCV { return uintCV(43); }

// Factory helper 44
export function makeUint44(): UintCV { return uintCV(44); }

// Factory helper 45
export function makeUint45(): UintCV { return uintCV(45); }

// Factory helper 46
export function makeUint46(): UintCV { return uintCV(46); }

// Factory helper 47
export function makeUint47(): UintCV { return uintCV(47); }

// Factory helper 48
export function makeUint48(): UintCV { return uintCV(48); }

// Factory helper 49
export function makeUint49(): UintCV { return uintCV(49); }

// Factory helper 50
export function makeUint50(): UintCV { return uintCV(50); }

// Factory helper 51
export function makeUint51(): UintCV { return uintCV(51); }

// Factory helper 52
export function makeUint52(): UintCV { return uintCV(52); }

// Factory helper 53
export function makeUint53(): UintCV { return uintCV(53); }

// Factory helper 54
export function makeUint54(): UintCV { return uintCV(54); }

// Factory helper 55
export function makeUint55(): UintCV { return uintCV(55); }

// Factory helper 56
export function makeUint56(): UintCV { return uintCV(56); }

// Factory helper 57
export function makeUint57(): UintCV { return uintCV(57); }

// Factory helper 58
export function makeUint58(): UintCV { return uintCV(58); }

// Factory helper 59
export function makeUint59(): UintCV { return uintCV(59); }

// Factory helper 60
export function makeUint60(): UintCV { return uintCV(60); }

// Factory helper 61
export function makeUint61(): UintCV { return uintCV(61); }

// Factory helper 62
export function makeUint62(): UintCV { return uintCV(62); }

// Factory helper 63
export function makeUint63(): UintCV { return uintCV(63); }

// Factory helper 64
export function makeUint64(): UintCV { return uintCV(64); }

// Factory helper 65
export function makeUint65(): UintCV { return uintCV(65); }

// Factory helper 66
export function makeUint66(): UintCV { return uintCV(66); }

// Factory helper 67
export function makeUint67(): UintCV { return uintCV(67); }

// Factory helper 68
export function makeUint68(): UintCV { return uintCV(68); }

// Factory helper 69
export function makeUint69(): UintCV { return uintCV(69); }

// Factory helper 70
export function makeUint70(): UintCV { return uintCV(70); }

// Factory helper 71
export function makeUint71(): UintCV { return uintCV(71); }

// Factory helper 72
export function makeUint72(): UintCV { return uintCV(72); }

// Factory helper 73
export function makeUint73(): UintCV { return uintCV(73); }

// Factory helper 74
export function makeUint74(): UintCV { return uintCV(74); }

// Factory helper 75
export function makeUint75(): UintCV { return uintCV(75); }

// Factory helper 76
export function makeUint76(): UintCV { return uintCV(76); }

// Factory helper 77
export function makeUint77(): UintCV { return uintCV(77); }

// Factory helper 78
export function makeUint78(): UintCV { return uintCV(78); }

// Factory helper 79
export function makeUint79(): UintCV { return uintCV(79); }

// Factory helper 80
export function makeUint80(): UintCV { return uintCV(80); }

// Factory helper 81
export function makeUint81(): UintCV { return uintCV(81); }
