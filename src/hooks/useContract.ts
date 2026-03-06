/**
 * React Hooks for Contract Interactions
 * Using Stacks.js v7+ with React Query
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { uintCV, stringAsciiCV, principalCV, ClarityValue } from '@stacks/transactions';
import { callContract, TransactionOptions, TransactionResult } from '../lib/transaction-builder';
import { callReadOnly, ReadOnlyOptions, ReadOnlyResult } from '../lib/read-only-calls';
import { parseStacksError } from '../lib/error-handler';
import { useWalletStore } from '../store/wallet-store';

/** Time in ms before cached contract data is considered stale */
const QUERY_STALE_TIME = 30000;

/** Interval in ms between automatic contract data refetches */
const QUERY_REFETCH_INTERVAL = 60000;

/** Type-safe query key for contract read operations */
type ContractQueryKey = readonly ['contract', string, string, ClarityValue[]];
