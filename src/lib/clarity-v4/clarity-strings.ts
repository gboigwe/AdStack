// Clarity v4 String Type Utilities

export type StringAscii = { type: 'string-ascii'; value: string; maxLength: number };

export type StringUtf8 = { type: 'string-utf8'; value: string; maxLength: number };

export type ClarityString = StringAscii | StringUtf8;

export const DEFAULT_MAX_STRING_LENGTH = 256;
export const ASCII_MAX_CODE = 0x7f;

export const EMPTY_ASCII: StringAscii = { type: 'string-ascii', value: '', maxLength: DEFAULT_MAX_STRING_LENGTH };
export const EMPTY_UTF8: StringUtf8 = { type: 'string-utf8', value: '', maxLength: DEFAULT_MAX_STRING_LENGTH };

export function isAsciiString(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > ASCII_MAX_CODE) return false;
  }
  return true;
}

export function makeStringAscii(value: string, maxLength = DEFAULT_MAX_STRING_LENGTH): StringAscii {
  if (!isAsciiString(value)) throw new Error('Non-ASCII characters found');
  if (value.length > maxLength) throw new RangeError(`ASCII string too long: ${value.length}`);
  return { type: 'string-ascii', value, maxLength };
}

export function makeStringUtf8(value: string, maxLength = DEFAULT_MAX_STRING_LENGTH): StringUtf8 {
  const byteLen = new TextEncoder().encode(value).length;
  if (byteLen > maxLength) throw new RangeError(`UTF-8 string too long: ${byteLen} bytes`);
  return { type: 'string-utf8', value, maxLength };
}

export function asciiLength(s: StringAscii): number {
  return s.value.length;
}

export function utf8ByteLength(s: StringUtf8): number {
  return new TextEncoder().encode(s.value).length;
}

export function concatAscii(a: StringAscii, b: StringAscii): StringAscii {
  return makeStringAscii(a.value + b.value, a.maxLength);
}

export function concatUtf8(a: StringUtf8, b: StringUtf8): StringUtf8 {
  return makeStringUtf8(a.value + b.value, a.maxLength);
}
