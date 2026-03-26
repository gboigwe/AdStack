// Clarity v4 ABI Encoding Helpers

export type AbiType =
  | 'uint128'
  | 'int128'
  | 'bool'
  | 'principal'
  | 'buff'
  | 'string-ascii'
  | 'string-utf8'
  | 'list'
  | 'tuple'
  | 'optional'
  | 'response'
  | 'none';

export type AbiParam = { name: string; type: AbiType | AbiTypeComplex };
export type AbiTypeComplex = { list: { type: AbiType } } | { tuple: AbiParam[] } | { optional: AbiType } | { response: { ok: AbiType; error: AbiType } };

export type AbiFunctionDef = {
  name: string;
  access: 'public' | 'read_only' | 'private';
  args: AbiParam[];
  outputs: { type: AbiType | AbiTypeComplex };
};

export type ContractAbi = {
  functions: AbiFunctionDef[];
  variables: Array<{ name: string; access: 'variable' | 'constant'; type: AbiType }>;
  maps: Array<{ name: string; key: AbiType; value: AbiType }>;
  fungibleTokens: Array<{ name: string }>;
  nonFungibleTokens: Array<{ name: string; type: AbiType }>;
};

export function getAbiFunctionDef(abi: ContractAbi, name: string): AbiFunctionDef | null {
  return abi.functions.find(f => f.name === name) ?? null;
}

export function validateAbiArgs(fn: AbiFunctionDef, args: unknown[]): boolean {
  return args.length === fn.args.length;
}
