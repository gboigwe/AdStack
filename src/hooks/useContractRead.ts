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
