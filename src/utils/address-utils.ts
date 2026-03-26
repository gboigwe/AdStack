// Address validation and manipulation utilities

const MAINNET_PREFIX = 'SP';
const TESTNET_PREFIX = 'ST';

export function isMainnetAddress(address: string): boolean {
  return address.startsWith(MAINNET_PREFIX);
}
export function isTestnetAddress(address: string): boolean {
  return address.startsWith(TESTNET_PREFIX);
}
