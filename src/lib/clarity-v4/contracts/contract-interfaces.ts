// Clarity v4 Contract Interface Definitions

export type FunctionArg = { name: string; type: string };

export type FunctionOutput = { type: string };

export type FunctionAccess = 'public' | 'read_only' | 'private';

export type ContractFunction = {
  name: string;
  access: FunctionAccess;
  args: FunctionArg[];
  outputs: FunctionOutput;
};

export type ContractVariable = { name: string; type: string; access: 'variable' | 'constant' };

export type ContractMap = { name: string; key: string; value: string };

export type ContractInterface = {
  functions: ContractFunction[];
  variables: ContractVariable[];
  maps: ContractMap[];
  fungibleTokens: string[];
  nonFungibleTokens: string[];
};

export function getPublicFunctions(iface: ContractInterface): ContractFunction[] {
  return iface.functions.filter(f => f.access === 'public');
}

export function getReadOnlyFunctions(iface: ContractInterface): ContractFunction[] {
  return iface.functions.filter(f => f.access === 'read_only');
}

export function findFunction(iface: ContractInterface, name: string): ContractFunction | null {
  return iface.functions.find(f => f.name === name) ?? null;
}

export function hasFunction(iface: ContractInterface, name: string, access?: FunctionAccess): boolean {
  const fn = findFunction(iface, name);
  if (!fn) return false;
  return access ? fn.access === access : true;
}
