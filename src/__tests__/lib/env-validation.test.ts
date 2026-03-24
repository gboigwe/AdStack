import { describe, it, expect, vi, afterEach } from 'vitest';
import { validateEnv } from '@/lib/env-validation';

describe('validateEnv', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('defaults network to mainnet when not set', () => {
    delete process.env.NEXT_PUBLIC_NETWORK;
    const config = validateEnv();
    expect(config.network).toBe('mainnet');
  });

  it('accepts valid network values', () => {
    process.env.NEXT_PUBLIC_NETWORK = 'testnet';
    expect(validateEnv().network).toBe('testnet');

    process.env.NEXT_PUBLIC_NETWORK = 'devnet';
    expect(validateEnv().network).toBe('devnet');

    process.env.NEXT_PUBLIC_NETWORK = 'mainnet';
    expect(validateEnv().network).toBe('mainnet');
  });

  it('falls back to mainnet for invalid network and warns', () => {
    process.env.NEXT_PUBLIC_NETWORK = 'invalid-net';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const config = validateEnv();
    expect(config.network).toBe('mainnet');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid NEXT_PUBLIC_NETWORK'));

    warnSpy.mockRestore();
  });

  it('warns about non-standard contract address prefix', () => {
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = '0x1234';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    validateEnv();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('does not start with SP'));

    warnSpy.mockRestore();
  });

  it('uses provided contract address when valid', () => {
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = 'SP123ABC';
    const config = validateEnv();
    expect(config.contractAddress).toBe('SP123ABC');
  });

  it('defaults contract address when not set', () => {
    delete process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const config = validateEnv();
    expect(config.contractAddress).toBe('SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD');
  });

  it('defaults apiUrl to Hiro API when not set', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    const config = validateEnv();
    expect(config.apiUrl).toBe('https://api.hiro.so');
  });

  it('uses provided API URL', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://custom.api.com';
    const config = validateEnv();
    expect(config.apiUrl).toBe('https://custom.api.com');
  });

  it('defaults walletConnectProjectId when not set', () => {
    delete process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    const config = validateEnv();
    expect(config.walletConnectProjectId).toBe('demo-project-id');
  });

  it('uses provided WalletConnect project ID', () => {
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = 'real-id-123';
    const config = validateEnv();
    expect(config.walletConnectProjectId).toBe('real-id-123');
  });
});
