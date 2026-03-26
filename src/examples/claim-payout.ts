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

export function buildClaimPayoutParams(args: ClaimPayoutArgs): ContractWriteParams {
  const [addr, name] = ESCROW_CONTRACT.split('.');
  const postCondition = makeStxEqCondition(addr, args.expectedAmountUstx);
  return {
    contractAddress: addr,
    contractName: name,
    functionName: 'claim-payout',
    functionArgs: [makeUint(args.campaignId)] as unknown[],
    postConditions: [postCondition],
    network: 'mainnet',
  };
}

export const EXAMPLE_CLAIM: ClaimPayoutArgs = {
  campaignId: 1n,
  publisherAddress: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
  expectedAmountUstx: 500_000n,
};
