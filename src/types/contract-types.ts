// Typed Clarity contract and ABI structures
import type { StxAddress } from './stacks-primitives';

export type ClarityTypeString =
  | 'uint128'
  | 'int128'
  | 'bool'
  | 'principal'
  | 'none'
  | `(optional ${string})`
  | `(response ${string} ${string})`
  | `(list ${string} ${string})`
  | `(tuple ${string})`
  | `(string-ascii ${string})`
  | `(string-utf8 ${string})`
  | `(buff ${string})`;

export interface AbiArg {
  name: string;
  type: string;
}

export interface AbiFunction {
  name: string;
  access: 'public' | 'private' | 'read_only';
  args: AbiArg[];
  outputs: { type: string };
}
