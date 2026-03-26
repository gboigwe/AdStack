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
