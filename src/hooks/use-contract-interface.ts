/**
 * use-contract-interface.ts
 * React hook to fetch a Clarity contract's on-chain ABI/interface.
 * Useful for dynamic form generation and contract introspection.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiUrl, SupportedNetwork } from '@/lib/stacks-network';
import { CONTRACT_ADDRESS } from '@/lib/stacks-config';
import type { ContractName } from '@/lib/stacks-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ClarityFunctionArg {
  name: string;
  type: string | Record<string, unknown>;
}

export interface ClarityFunction {
  name: string;
  access: 'public' | 'read_only' | 'private';
  args: ClarityFunctionArg[];
  outputs: { type: string | Record<string, unknown> };
}

export interface ClarityVariable {
  name: string;
  type: string | Record<string, unknown>;
  access: 'constant' | 'variable';
}

export interface ClarityMap {
  name: string;
  key: string | Record<string, unknown>;
  value: string | Record<string, unknown>;
}

export interface ContractInterface {
  functions: ClarityFunction[];
  variables: ClarityVariable[];
  maps: ClarityMap[];
  fungible_tokens: Array<{ name: string }>;
  non_fungible_tokens: Array<{ name: string; type: unknown }>;
  epoch: string;
  clarity_version: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface ContractInterfaceState {
  interface: ContractInterface | null;
  publicFunctions: ClarityFunction[];
  readOnlyFunctions: ClarityFunction[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and cache a contract's Clarity interface from Hiro API.
 * The interface is stable after deployment so caching is infinite.
 */
export function useContractInterface(
  contractName: ContractName | string,
  contractAddress?: string,
  network?: SupportedNetwork,
): ContractInterfaceState {
  const [iface, setIface] = useState<ContractInterface | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const address = contractAddress ?? CONTRACT_ADDRESS;

  const fetchInterface = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = getApiUrl(network);
      const url = `${apiUrl}/v2/contracts/interface/${address}/${contractName}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Contract interface not found: ${address}.${contractName}`);
      }

      const data: ContractInterface = await response.json();
      setIface(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch interface');
    } finally {
      setLoading(false);
    }
  }, [contractName, address, network]);

  useEffect(() => {
    fetchInterface();
  }, [fetchInterface]);

  const publicFunctions = iface?.functions.filter((f) => f.access === 'public') ?? [];
  const readOnlyFunctions = iface?.functions.filter((f) => f.access === 'read_only') ?? [];

  return {
    interface: iface,
    publicFunctions,
    readOnlyFunctions,
    loading,
    error,
  };
}
