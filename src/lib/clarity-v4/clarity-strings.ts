// Clarity v4 String Type Utilities

export type StringAscii = { type: 'string-ascii'; value: string; maxLength: number };

export type StringUtf8 = { type: 'string-utf8'; value: string; maxLength: number };

export type ClarityString = StringAscii | StringUtf8;
