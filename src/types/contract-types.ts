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

export interface AbiMap {
  name: string;
  key: string;
  value: string;
}

export interface AbiVariable {
  name: string;
  access: 'constant' | 'variable';
  type: string;
}

export interface ContractAbi {
  functions: AbiFunction[];
  variables: AbiVariable[];
  maps: AbiMap[];
  fungible_tokens: Array<{ name: string }>;
  non_fungible_tokens: Array<{ name: string; type: string }>;
  epoch: string;
  clarity_version: string;
}

export interface ContractInfo {
  tx_id: string;
  canonical: boolean;
  contract_id: string;
  block_height: number;
  source_code: string;
  abi: string;
  clarity_version: number;
}

export interface ReadOnlyResult {
  okay: boolean;
  result: string;
}

export function parseContractAbi(raw: string): ContractAbi {
  return JSON.parse(raw) as ContractAbi;
}
export function getPublicFunctions(abi: ContractAbi): AbiFunction[] {
  return abi.functions.filter(f => f.access === 'public');
}
export function getReadOnlyFunctions(abi: ContractAbi): AbiFunction[] {
  return abi.functions.filter(f => f.access === 'read_only');
}
