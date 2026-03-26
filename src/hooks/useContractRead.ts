// useContractRead: call a read-only Clarity contract function
import { useState, useEffect, useCallback, useRef } from 'react';

export interface ContractReadParams {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs?: string[];
  senderAddress?: string;
  network?: 'mainnet' | 'testnet';
}

export interface ContractReadState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  isFetched: boolean;
}

const HIRO_MAINNET = 'https://api.hiro.so';
const HIRO_TESTNET = 'https://api.testnet.hiro.so';

async function callReadOnly<T>(params: ContractReadParams): Promise<T> {
  const base = params.network === 'testnet' ? HIRO_TESTNET : HIRO_MAINNET;
  const url = `${base}/v2/contracts/call-read/${params.contractAddress}/${params.contractName}/${params.functionName}`;
  const body = {
    sender: params.senderAddress ?? params.contractAddress,
    arguments: params.functionArgs ?? [],
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Read-only call failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function useContractRead<T>(params: ContractReadParams, enabled = true) {
  const [state, setState] = useState<ContractReadState<T>>({
    data: null, isLoading: false, isError: false, error: null, isFetched: false,
  });
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetch = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, isError: false, error: null }));
    try {
      const data = await callReadOnly<T>(paramsRef.current);
      setState({ data, isLoading: false, isError: false, error: null, isFetched: true });
    } catch (e) {
      setState({ data: null, isLoading: false, isError: true, error: String(e), isFetched: true });
    }
  }, []);

  useEffect(() => {
    if (enabled) fetch();
  }, [enabled, fetch]);

  return { ...state, refetch: fetch };
}
