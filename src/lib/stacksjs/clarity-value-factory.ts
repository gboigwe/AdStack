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

// Factory helper 82
export function makeUint82(): UintCV { return uintCV(82); }

// Factory helper 83
export function makeUint83(): UintCV { return uintCV(83); }

// Factory helper 84
export function makeUint84(): UintCV { return uintCV(84); }

// Factory helper 85
export function makeUint85(): UintCV { return uintCV(85); }

// Factory helper 86
export function makeUint86(): UintCV { return uintCV(86); }

// Factory helper 87
export function makeUint87(): UintCV { return uintCV(87); }

// Factory helper 88
export function makeUint88(): UintCV { return uintCV(88); }

// Factory helper 89
export function makeUint89(): UintCV { return uintCV(89); }

// Factory helper 90
export function makeUint90(): UintCV { return uintCV(90); }

// Factory helper 91
export function makeUint91(): UintCV { return uintCV(91); }

// Factory helper 92
export function makeUint92(): UintCV { return uintCV(92); }

// Factory helper 93
export function makeUint93(): UintCV { return uintCV(93); }

// Factory helper 94
export function makeUint94(): UintCV { return uintCV(94); }

// Factory helper 95
export function makeUint95(): UintCV { return uintCV(95); }

// Factory helper 96
export function makeUint96(): UintCV { return uintCV(96); }

// Factory helper 97
export function makeUint97(): UintCV { return uintCV(97); }

// Factory helper 98
export function makeUint98(): UintCV { return uintCV(98); }

// Factory helper 99
export function makeUint99(): UintCV { return uintCV(99); }

// Factory helper 100
export function makeUint100(): UintCV { return uintCV(100); }

// Factory helper 101
export function makeUint101(): UintCV { return uintCV(101); }

// Factory helper 102
export function makeUint102(): UintCV { return uintCV(102); }

// Factory helper 103
export function makeUint103(): UintCV { return uintCV(103); }

// Factory helper 104
export function makeUint104(): UintCV { return uintCV(104); }

// Factory helper 105
export function makeUint105(): UintCV { return uintCV(105); }

// Factory helper 106
export function makeUint106(): UintCV { return uintCV(106); }

// Factory helper 107
export function makeUint107(): UintCV { return uintCV(107); }

// Factory helper 108
export function makeUint108(): UintCV { return uintCV(108); }

// Factory helper 109
export function makeUint109(): UintCV { return uintCV(109); }

// Factory helper 110
export function makeUint110(): UintCV { return uintCV(110); }

// Factory helper 111
export function makeUint111(): UintCV { return uintCV(111); }

// Factory helper 112
export function makeUint112(): UintCV { return uintCV(112); }

// Factory helper 113
export function makeUint113(): UintCV { return uintCV(113); }

// Factory helper 114
export function makeUint114(): UintCV { return uintCV(114); }

// Factory helper 115
export function makeUint115(): UintCV { return uintCV(115); }

// Factory helper 116
export function makeUint116(): UintCV { return uintCV(116); }

// Factory helper 117
export function makeUint117(): UintCV { return uintCV(117); }

// Factory helper 118
export function makeUint118(): UintCV { return uintCV(118); }

// Factory helper 119
export function makeUint119(): UintCV { return uintCV(119); }

// Factory helper 120
export function makeUint120(): UintCV { return uintCV(120); }

// Factory helper 121
export function makeUint121(): UintCV { return uintCV(121); }

// Factory helper 122
export function makeUint122(): UintCV { return uintCV(122); }

// Factory helper 123
export function makeUint123(): UintCV { return uintCV(123); }

// Factory helper 124
export function makeUint124(): UintCV { return uintCV(124); }

// Factory helper 125
export function makeUint125(): UintCV { return uintCV(125); }

// Factory helper 126
export function makeUint126(): UintCV { return uintCV(126); }

// Factory helper 127
export function makeUint127(): UintCV { return uintCV(127); }

// Factory helper 128
export function makeUint128(): UintCV { return uintCV(128); }

// Factory helper 129
export function makeUint129(): UintCV { return uintCV(129); }

// Factory helper 130
export function makeUint130(): UintCV { return uintCV(130); }

// Factory helper 131
export function makeUint131(): UintCV { return uintCV(131); }

// Factory helper 132
export function makeUint132(): UintCV { return uintCV(132); }

// Factory helper 133
export function makeUint133(): UintCV { return uintCV(133); }

// Factory helper 134
export function makeUint134(): UintCV { return uintCV(134); }

// Factory helper 135
export function makeUint135(): UintCV { return uintCV(135); }

// Factory helper 136
export function makeUint136(): UintCV { return uintCV(136); }

// Factory helper 137
export function makeUint137(): UintCV { return uintCV(137); }

// Factory helper 138
export function makeUint138(): UintCV { return uintCV(138); }

// Factory helper 139
export function makeUint139(): UintCV { return uintCV(139); }

// Factory helper 140
export function makeUint140(): UintCV { return uintCV(140); }

// Factory helper 141
export function makeUint141(): UintCV { return uintCV(141); }

// Factory helper 142
export function makeUint142(): UintCV { return uintCV(142); }

// Factory helper 143
export function makeUint143(): UintCV { return uintCV(143); }

// Factory helper 144
export function makeUint144(): UintCV { return uintCV(144); }

// Factory helper 145
export function makeUint145(): UintCV { return uintCV(145); }

// Factory helper 146
export function makeUint146(): UintCV { return uintCV(146); }

// Factory helper 147
export function makeUint147(): UintCV { return uintCV(147); }

// Factory helper 148
export function makeUint148(): UintCV { return uintCV(148); }

// Factory helper 149
export function makeUint149(): UintCV { return uintCV(149); }

// Factory helper 150
export function makeUint150(): UintCV { return uintCV(150); }

// Factory helper 151
export function makeUint151(): UintCV { return uintCV(151); }

// Factory helper 152
export function makeUint152(): UintCV { return uintCV(152); }

// Factory helper 153
export function makeUint153(): UintCV { return uintCV(153); }

// Factory helper 154
export function makeUint154(): UintCV { return uintCV(154); }

// Factory helper 155
export function makeUint155(): UintCV { return uintCV(155); }

// Factory helper 156
export function makeUint156(): UintCV { return uintCV(156); }

// Factory helper 157
export function makeUint157(): UintCV { return uintCV(157); }

// Factory helper 158
export function makeUint158(): UintCV { return uintCV(158); }

// Factory helper 159
export function makeUint159(): UintCV { return uintCV(159); }

// Factory helper 160
export function makeUint160(): UintCV { return uintCV(160); }

// Factory helper 161
export function makeUint161(): UintCV { return uintCV(161); }

// Factory helper 162
export function makeUint162(): UintCV { return uintCV(162); }

// Factory helper 163
export function makeUint163(): UintCV { return uintCV(163); }

// Factory helper 164
export function makeUint164(): UintCV { return uintCV(164); }

// Factory helper 165
export function makeUint165(): UintCV { return uintCV(165); }

// Factory helper 166
export function makeUint166(): UintCV { return uintCV(166); }

// Factory helper 167
export function makeUint167(): UintCV { return uintCV(167); }

// Factory helper 168
export function makeUint168(): UintCV { return uintCV(168); }

// Factory helper 169
export function makeUint169(): UintCV { return uintCV(169); }

// Factory helper 170
export function makeUint170(): UintCV { return uintCV(170); }

// Factory helper 171
export function makeUint171(): UintCV { return uintCV(171); }

// Factory helper 172
export function makeUint172(): UintCV { return uintCV(172); }

// Factory helper 173
export function makeUint173(): UintCV { return uintCV(173); }

// Factory helper 174
export function makeUint174(): UintCV { return uintCV(174); }

// Factory helper 175
export function makeUint175(): UintCV { return uintCV(175); }

// Factory helper 176
export function makeUint176(): UintCV { return uintCV(176); }

// Factory helper 177
export function makeUint177(): UintCV { return uintCV(177); }

// Factory helper 178
export function makeUint178(): UintCV { return uintCV(178); }

// Factory helper 179
export function makeUint179(): UintCV { return uintCV(179); }

// Factory helper 180
export function makeUint180(): UintCV { return uintCV(180); }
