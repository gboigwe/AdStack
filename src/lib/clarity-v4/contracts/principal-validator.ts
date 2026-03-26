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

export function isAnyPrincipal(address: string): boolean {
  return isStandardPrincipal(address) || isContractPrincipal(address);
}

export function isMainnetPrincipal(address: string): boolean {
  return address.startsWith(MAINNET_PREFIX) && isAnyPrincipal(address);
}

export function isTestnetPrincipal(address: string): boolean {
  return address.startsWith(TESTNET_PREFIX) && isAnyPrincipal(address);
}

export function parsePrincipal(address: string): ParsedPrincipal | null {
  if (!isAnyPrincipal(address)) return null;
  const network = address.startsWith(MAINNET_PREFIX) ? 'mainnet' : 'testnet';
  if (isContractPrincipal(address)) {
    const [addr, name] = address.split('.');
    return { type: 'contract', address: addr, contractName: name, network };
  }
  return { type: 'standard', address, network };
}

export function principalToString(parsed: ParsedPrincipal): string {
  if (parsed.type === 'contract' && parsed.contractName) {
    return `${parsed.address}.${parsed.contractName}`;
  }
  return parsed.address;
}

export function extractContractAddress(contractPrincipal: string): string | null {
  if (!isContractPrincipal(contractPrincipal)) return null;
  return contractPrincipal.split('.')[0];
}

export function extractContractName(contractPrincipal: string): string | null {
  if (!isContractPrincipal(contractPrincipal)) return null;
  return contractPrincipal.split('.')[1] ?? null;
}

export function switchPrincipalNetwork(address: string): string | null {
  if (!isAnyPrincipal(address)) return null;
  if (address.startsWith(MAINNET_PREFIX)) return TESTNET_PREFIX + address.slice(2);
  return MAINNET_PREFIX + address.slice(2);
}

export function validatePrincipalOrThrow(address: string): void {
  if (!isAnyPrincipal(address)) {
    throw new Error(`Invalid Stacks principal: ${address}`);
  }
}

export function areSamePrincipal(a: string, b: string): boolean {
  const pa = parsePrincipal(a);
  const pb = parsePrincipal(b);
  if (!pa || !pb) return false;
  return principalToString(pa) === principalToString(pb);
}

export function normalizePrincipal(address: string): string {
  const parsed = parsePrincipal(address);
  if (!parsed) return address;
  return principalToString(parsed);
}

export function getPrincipalNetwork(address: string): 'mainnet' | 'testnet' | 'unknown' {
  if (address.startsWith(MAINNET_PREFIX)) return 'mainnet';
  if (address.startsWith(TESTNET_PREFIX)) return 'testnet';
  return 'unknown';
}

export function isDeployerPrincipal(address: string, expectedDeployer: string): boolean {
  return normalizePrincipal(address) === normalizePrincipal(expectedDeployer);
}
