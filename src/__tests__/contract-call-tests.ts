// Tests for contract call request building
import { describe, it, expect } from 'vitest';
import { buildContractCallRequest, withNetwork, withFee } from '../lib/connect/contract-call-request';

describe('buildContractCallRequest', () => {
  const base = {
    contractAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    contractName: 'my-contract',
    functionName: 'my-function',
    functionArgs: [],
    network: 'mainnet' as const,
  };

  it('builds request with required fields', () => {
    const req = buildContractCallRequest(base);
    expect(req.contractAddress).toBe(base.contractAddress);
    expect(req.contractName).toBe(base.contractName);
    expect(req.functionName).toBe(base.functionName);
  });
  it('includes empty functionArgs by default', () => {
    const req = buildContractCallRequest(base);
    expect(req.functionArgs).toEqual([]);
  });
});

describe('withNetwork', () => {
  it('overrides the network field', () => {
    const req = buildContractCallRequest({
      contractAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      contractName: 'c', functionName: 'f', functionArgs: [], network: 'mainnet',
    });
    const testnetReq = withNetwork(req, 'testnet');
    expect(testnetReq.network).toBe('testnet');
  });
});
