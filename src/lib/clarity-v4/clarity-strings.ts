// Clarity v4 String Type Utilities

export type StringAscii = { type: 'string-ascii'; value: string; maxLength: number };

export type StringUtf8 = { type: 'string-utf8'; value: string; maxLength: number };

export type ClarityString = StringAscii | StringUtf8;

export const DEFAULT_MAX_STRING_LENGTH = 256;
export const ASCII_MAX_CODE = 0x7f;
