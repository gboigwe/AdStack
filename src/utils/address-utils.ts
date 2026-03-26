// Address validation and manipulation utilities

const MAINNET_PREFIX = 'SP';
const TESTNET_PREFIX = 'ST';

export function isMainnetAddress(address: string): boolean {
  return address.startsWith(MAINNET_PREFIX);
}
export function isTestnetAddress(address: string): boolean {
  return address.startsWith(TESTNET_PREFIX);
}

export function isContractPrincipal(address: string): boolean {
  return address.includes('.');
}
export function isStandardPrincipal(address: string): boolean {
  return !address.includes('.');
}

export function getContractAddress(principal: string): string {
  return principal.split('.')[0];
}
export function getContractName(principal: string): string | null {
  const parts = principal.split('.');
  return parts.length > 1 ? parts[1] : null;
}

export function switchNetwork(address: string, to: 'mainnet' | 'testnet'): string {
  const prefix = to === 'mainnet' ? MAINNET_PREFIX : TESTNET_PREFIX;
  return prefix + address.slice(2);
}

export function validateStxAddress(address: string): boolean {
  const regex = /^(SP|ST)[A-Z0-9]{33,39}$/;
  return regex.test(address);
}

export function validateContractPrincipal(principal: string): boolean {
  const regex = /^(SP|ST)[A-Z0-9]{1,40}\.[a-zA-Z0-9_-]{1,128}$/;
  return regex.test(principal);
}
