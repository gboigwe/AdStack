import { describe, it, expect } from 'vitest';
import {
  isValidStacksAddress,
  isAddressForNetwork,
  isValidContractId,
} from '@/lib/address-validation';

const VALID_MAINNET = 'SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD';
const VALID_TESTNET = 'ST3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD';

describe('isValidStacksAddress', () => {
  it('accepts valid mainnet address', () => {
    expect(isValidStacksAddress(VALID_MAINNET)).toBe(true);
  });

  it('accepts valid testnet address', () => {
    expect(isValidStacksAddress(VALID_TESTNET)).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidStacksAddress('')).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(isValidStacksAddress(null as unknown as string)).toBe(false);
  });

  it('rejects wrong prefix', () => {
    expect(isValidStacksAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(false);
  });

  it('rejects too-short address', () => {
    expect(isValidStacksAddress('SP123')).toBe(false);
  });

  it('rejects too-long address', () => {
    const long = 'SP' + 'A'.repeat(50);
    expect(isValidStacksAddress(long)).toBe(false);
  });
});

describe('isAddressForNetwork', () => {
  it('mainnet address matches mainnet', () => {
    expect(isAddressForNetwork(VALID_MAINNET, 'mainnet')).toBe(true);
  });

  it('mainnet address does not match testnet', () => {
    expect(isAddressForNetwork(VALID_MAINNET, 'testnet')).toBe(false);
  });

  it('testnet address matches testnet', () => {
    expect(isAddressForNetwork(VALID_TESTNET, 'testnet')).toBe(true);
  });

  it('rejects invalid address', () => {
    expect(isAddressForNetwork('invalid', 'mainnet')).toBe(false);
  });
});

describe('isValidContractId', () => {
  it('accepts valid contract ID', () => {
    expect(isValidContractId(`${VALID_MAINNET}.my-contract`)).toBe(true);
  });

  it('rejects missing dot separator', () => {
    expect(isValidContractId(VALID_MAINNET)).toBe(false);
  });

  it('rejects empty contract name', () => {
    expect(isValidContractId(`${VALID_MAINNET}.`)).toBe(false);
  });

  it('rejects contract name starting with number', () => {
    expect(isValidContractId(`${VALID_MAINNET}.1bad-name`)).toBe(false);
  });

  it('rejects contract name starting with hyphen', () => {
    expect(isValidContractId(`${VALID_MAINNET}.-bad`)).toBe(false);
  });

  it('accepts alphanumeric with hyphens', () => {
    expect(isValidContractId(`${VALID_MAINNET}.my-contract-v2`)).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidContractId('')).toBe(false);
  });
});
