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

export const STANDARD_ADDRESS_REGEX = /^(SP|ST)[A-Z0-9]{33,39}$/;

export const CONTRACT_PRINCIPAL_REGEX = /^(SP|ST)[A-Z0-9]{1,40}\.[a-zA-Z][a-zA-Z0-9_-]{0,39}$/;

export function isStandardPrincipal(address: string): boolean {
  return STANDARD_ADDRESS_REGEX.test(address);
}

export function isContractPrincipal(address: string): boolean {
  return CONTRACT_PRINCIPAL_REGEX.test(address);
}
