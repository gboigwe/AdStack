/**
 * Stacks Address Validation
 * Validates STX addresses before use in transactions or API calls.
 */

/** Stacks mainnet addresses start with SP, testnet with ST. */
const MAINNET_PREFIX = 'SP';
const TESTNET_PREFIX = 'ST';

/** Valid Crockford Base32 characters used in Stacks addresses. */
const CROCKFORD_BASE32 = /^[0-9A-HJ-NP-TV-Z]+$/i;

/**
 * Check if a string is a valid Stacks address format.
 * Validates prefix (SP/ST), length (between 38-42 chars), and character set.
 */
export function isValidStacksAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;

  // Must start with SP (mainnet) or ST (testnet)
  if (!address.startsWith(MAINNET_PREFIX) && !address.startsWith(TESTNET_PREFIX)) {
    return false;
  }

  // Standard Stacks addresses are 38-42 characters
  if (address.length < 38 || address.length > 42) {
    return false;
  }

  // The portion after the prefix must be valid Crockford Base32
  const body = address.slice(2);
  if (!CROCKFORD_BASE32.test(body)) {
    return false;
  }

  return true;
}

/**
 * Check if address matches the expected network.
 */
export function isAddressForNetwork(
  address: string,
  network: 'mainnet' | 'testnet',
): boolean {
  if (!isValidStacksAddress(address)) return false;

  return network === 'mainnet'
    ? address.startsWith(MAINNET_PREFIX)
    : address.startsWith(TESTNET_PREFIX);
}

/**
 * Validate a contract identifier (address.contract-name).
 */
export function isValidContractId(contractId: string): boolean {
  if (!contractId || !contractId.includes('.')) return false;

  const parts = contractId.split('.', 2);
  const address = parts[0] ?? '';
  const contractName = parts[1];

  if (!isValidStacksAddress(address)) return false;

  // Contract names: 1-128 chars, alphanumeric plus hyphens
  if (!contractName || contractName.length > 128) return false;
  if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(contractName)) return false;

  return true;
}
