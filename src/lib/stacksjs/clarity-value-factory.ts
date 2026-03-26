// Stacks.js SDK ClarityValue factory functions

export type CvType = 'uint' | 'int' | 'bool' | 'principal' | 'buffer' | 'string-ascii' | 'string-utf8' | 'list' | 'tuple' | 'optional' | 'response-ok' | 'response-err' | 'none' | 'some';

export type UintCV = { type: 'uint'; value: bigint };
export type IntCV = { type: 'int'; value: bigint };
export type BoolCV = { type: 'bool'; value: boolean };
