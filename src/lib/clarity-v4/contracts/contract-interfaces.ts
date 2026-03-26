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
