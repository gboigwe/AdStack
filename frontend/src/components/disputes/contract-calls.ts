import {
  uintCV,
  stringAsciiCV,
  stringUtf8CV,
  principalCV,
  bufferCV,
  boolCV,
  listCV,
  ClarityValue,
} from '@stacks/transactions';
import { callContract, TransactionResult } from '../../lib/transaction-builder';
import { callReadOnly, ReadOnlyResult } from '../../lib/read-only-calls';
import { CONTRACTS } from '../../lib/stacks-config';

export async function fileDispute(
  respondent: string,
  disputeType: number,
  severity: number,
  amount: number,
  campaignId: number,
  description: string,
  category: string
): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.DISPUTE_MANAGER,
    functionName: 'file-dispute',
    functionArgs: [
      principalCV(respondent),
      uintCV(disputeType),
      uintCV(severity),
      uintCV(amount),
      uintCV(campaignId),
      stringUtf8CV(description),
      stringAsciiCV(category),
    ],
  });
}

export async function acknowledgeDispute(caseId: number): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.DISPUTE_MANAGER,
    functionName: 'acknowledge-dispute',
    functionArgs: [uintCV(caseId)],
  });
}

export async function moveToInvestigation(caseId: number): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.DISPUTE_MANAGER,
    functionName: 'move-to-investigation',
    functionArgs: [uintCV(caseId)],
  });
}

export async function escalateToArbitration(caseId: number): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.DISPUTE_MANAGER,
    functionName: 'escalate-to-arbitration',
    functionArgs: [uintCV(caseId)],
  });
}

export async function resolveCase(caseId: number): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.DISPUTE_MANAGER,
    functionName: 'resolve-case',
    functionArgs: [uintCV(caseId)],
  });
}

export async function dismissCase(caseId: number, reason: string): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.DISPUTE_MANAGER,
    functionName: 'dismiss-case',
    functionArgs: [uintCV(caseId), stringUtf8CV(reason)],
  });
}

export async function fileCounterClaim(
  caseId: number,
  amount: number,
  description: string
): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.DISPUTE_MANAGER,
    functionName: 'file-counter-claim',
    functionArgs: [uintCV(caseId), uintCV(amount), stringUtf8CV(description)],
  });
}

export async function getCase(caseId: number): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.DISPUTE_MANAGER,
    functionName: 'get-case',
    functionArgs: [uintCV(caseId)],
  });
}

export async function getCaseMetadata(caseId: number): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.DISPUTE_MANAGER,
    functionName: 'get-case-metadata',
    functionArgs: [uintCV(caseId)],
  });
}

export async function isSlaBreached(caseId: number): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.DISPUTE_MANAGER,
    functionName: 'is-sla-breached',
    functionArgs: [uintCV(caseId)],
  });
}

export async function registerArbitrator(
  specialization: string,
  stakeAmount: number
): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.ARBITRATOR_REGISTRY,
    functionName: 'register-arbitrator',
    functionArgs: [stringAsciiCV(specialization), uintCV(stakeAmount)],
  });
}

export async function assignCase(
  caseId: number,
  arbitrator: string
): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.ARBITRATOR_REGISTRY,
    functionName: 'assign-case',
    functionArgs: [uintCV(caseId), principalCV(arbitrator)],
  });
}

export async function acceptAssignment(caseId: number): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.ARBITRATOR_REGISTRY,
    functionName: 'accept-assignment',
    functionArgs: [uintCV(caseId)],
  });
}

export async function rateArbitrator(
  arbitrator: string,
  caseId: number,
  score: number,
  feedback: string
): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.ARBITRATOR_REGISTRY,
    functionName: 'rate-arbitrator',
    functionArgs: [principalCV(arbitrator), uintCV(caseId), uintCV(score), stringUtf8CV(feedback)],
  });
}

export async function getArbitrator(address: string): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.ARBITRATOR_REGISTRY,
    functionName: 'get-arbitrator',
    functionArgs: [principalCV(address)],
  });
}

export async function getArbitratorPerformance(address: string): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.ARBITRATOR_REGISTRY,
    functionName: 'get-arbitrator-performance',
    functionArgs: [principalCV(address)],
  });
}

export async function isArbitratorAvailable(address: string): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.ARBITRATOR_REGISTRY,
    functionName: 'is-arbitrator-available',
    functionArgs: [principalCV(address)],
  });
}

export async function submitEvidence(
  caseId: number,
  evidenceType: number,
  contentHash: Uint8Array,
  ipfsCid: string,
  fileSize: number,
  accessLevel: number,
  description: string
): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.EVIDENCE_VAULT,
    functionName: 'submit-evidence',
    functionArgs: [
      uintCV(caseId),
      uintCV(evidenceType),
      bufferCV(contentHash),
      stringAsciiCV(ipfsCid),
      uintCV(fileSize),
      uintCV(accessLevel),
      stringUtf8CV(description),
    ],
  });
}

export async function verifyEvidence(evidenceId: number): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.EVIDENCE_VAULT,
    functionName: 'verify-evidence',
    functionArgs: [uintCV(evidenceId)],
  });
}

export async function challengeEvidence(
  evidenceId: number,
  reason: string
): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.EVIDENCE_VAULT,
    functionName: 'challenge-evidence',
    functionArgs: [uintCV(evidenceId), stringUtf8CV(reason)],
  });
}

export async function sealCaseEvidence(caseId: number): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.EVIDENCE_VAULT,
    functionName: 'seal-case-evidence',
    functionArgs: [uintCV(caseId)],
  });
}

export async function getEvidence(evidenceId: number): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.EVIDENCE_VAULT,
    functionName: 'get-evidence',
    functionArgs: [uintCV(evidenceId)],
  });
}

export async function getCaseEvidenceIndex(caseId: number): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.EVIDENCE_VAULT,
    functionName: 'get-case-evidence-index',
    functionArgs: [uintCV(caseId)],
  });
}

export async function issueJudgment(
  caseId: number,
  outcome: number,
  claimantAward: number,
  respondentAward: number,
  arbitratorFee: number,
  reasoning: string,
  penaltyLevel: number
): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.JUDGMENT_EXECUTOR,
    functionName: 'issue-judgment',
    functionArgs: [
      uintCV(caseId),
      uintCV(outcome),
      uintCV(claimantAward),
      uintCV(respondentAward),
      uintCV(arbitratorFee),
      stringUtf8CV(reasoning),
      uintCV(penaltyLevel),
    ],
  });
}

export async function executeJudgment(judgmentId: number): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.JUDGMENT_EXECUTOR,
    functionName: 'execute-judgment',
    functionArgs: [uintCV(judgmentId)],
  });
}

export async function fileAppeal(
  caseId: number,
  appealRound: number,
  grounds: string
): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.JUDGMENT_EXECUTOR,
    functionName: 'file-appeal',
    functionArgs: [uintCV(caseId), uintCV(appealRound), stringUtf8CV(grounds)],
  });
}

export async function decideAppeal(
  caseId: number,
  appealRound: number,
  granted: boolean,
  reason: string
): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.JUDGMENT_EXECUTOR,
    functionName: 'decide-appeal',
    functionArgs: [uintCV(caseId), uintCV(appealRound), boolCV(granted), stringUtf8CV(reason)],
  });
}

export async function offerSettlement(
  caseId: number,
  claimantAmount: number,
  respondentAmount: number,
  terms: string
): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.JUDGMENT_EXECUTOR,
    functionName: 'offer-settlement',
    functionArgs: [
      uintCV(caseId),
      uintCV(claimantAmount),
      uintCV(respondentAmount),
      stringUtf8CV(terms),
    ],
  });
}

export async function acceptSettlement(caseId: number): Promise<TransactionResult> {
  return callContract({
    contractName: CONTRACTS.JUDGMENT_EXECUTOR,
    functionName: 'accept-settlement',
    functionArgs: [uintCV(caseId)],
  });
}

export async function getJudgment(judgmentId: number): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.JUDGMENT_EXECUTOR,
    functionName: 'get-judgment',
    functionArgs: [uintCV(judgmentId)],
  });
}

export async function getJudgmentByCase(caseId: number): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.JUDGMENT_EXECUTOR,
    functionName: 'get-judgment-by-case',
    functionArgs: [uintCV(caseId)],
  });
}

export async function canAppealJudgment(caseId: number): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.JUDGMENT_EXECUTOR,
    functionName: 'can-appeal-judgment',
    functionArgs: [uintCV(caseId)],
  });
}

export async function getAppeal(
  caseId: number,
  appealRound: number
): Promise<ReadOnlyResult> {
  return callReadOnly({
    contractName: CONTRACTS.JUDGMENT_EXECUTOR,
    functionName: 'get-appeal',
    functionArgs: [uintCV(caseId), uintCV(appealRound)],
  });
}
