// Example: claiming publisher payout from escrow contract
import type { ContractWriteParams } from '../hooks/useContractWrite';
import { makeUint } from '../lib/clarity-v4/clarity-primitives';
import { makeStxEqCondition } from '../lib/transactions/post-condition-builder';
