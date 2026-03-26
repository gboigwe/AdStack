// Example: claiming publisher payout from escrow contract
import type { ContractWriteParams } from '../hooks/useContractWrite';
import { makeUint } from '../lib/clarity-v4/clarity-primitives';
import { makeStxEqCondition } from '../lib/transactions/post-condition-builder';

export const ESCROW_CONTRACT = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7.adstack-escrow';

export interface ClaimPayoutArgs {
  campaignId: bigint;
  publisherAddress: string;
  expectedAmountUstx: bigint;
}
