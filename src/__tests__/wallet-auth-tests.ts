// Tests for wallet auth request building
import { describe, it, expect } from 'vitest';
import { buildAuthRequest, parseAuthResponse, extractStxAddress } from '../lib/connect/auth-request';

describe('buildAuthRequest', () => {
  it('builds request with app details', () => {
    const req = buildAuthRequest({
      appDetails: { name: 'TestApp', icon: 'https://example.com/icon.png' },
      redirectTo: '/',
      onFinish: () => {},
      onCancel: () => {},
    });
    expect(req.appDetails.name).toBe('TestApp');
  });
  it('includes redirectTo in request', () => {
    const req = buildAuthRequest({
      appDetails: { name: 'App', icon: 'https://example.com/i.png' },
      redirectTo: '/dashboard',
      onFinish: () => {},
      onCancel: () => {},
    });
    expect(req.redirectTo).toBe('/dashboard');
  });
});

describe('extractStxAddress', () => {
  it('extracts mainnet address', () => {
    const payload = { profile: { stxAddress: { mainnet: 'SP123', testnet: 'ST123' } } };
    expect(extractStxAddress(payload as Parameters<typeof extractStxAddress>[0], 'mainnet')).toBe('SP123');
  });
  it('extracts testnet address', () => {
    const payload = { profile: { stxAddress: { mainnet: 'SP123', testnet: 'ST123' } } };
    expect(extractStxAddress(payload as Parameters<typeof extractStxAddress>[0], 'testnet')).toBe('ST123');
  });
});
