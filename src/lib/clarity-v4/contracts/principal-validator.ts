// Clarity v4 Principal Validation Utilities

export type PrincipalType = 'standard' | 'contract';

export type ParsedPrincipal = {
  type: PrincipalType;
  address: string;
  contractName?: string;
  network: 'mainnet' | 'testnet';
};

export const MAINNET_PREFIX = 'SP';
export const TESTNET_PREFIX = 'ST';
