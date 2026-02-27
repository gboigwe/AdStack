export interface DisputeCase {
  caseId: number;
  claimant: string;
  respondent: string;
  campaignId: number;
  disputeType: number;
  severity: number;
  priority: number;
  amountAtStake: number;
  status: number;
  description: string;
  filedAt: number;
  acknowledgedAt: number;
  slaDeadline: number;
  lastActivity: number;
  escalationCount: number;
}

export interface CaseMetadata {
  categoryTags: string[];
  relatedCaseId: number | null;
  externalRef: string | null;
  resolutionNotes: string;
  finalOutcome: number;
}

export interface PartyCases {
  activeCases: number;
  totalFiled: number;
  totalAsRespondent: number;
  lastFiling: number;
  wins: number;
  losses: number;
}

export interface TimelineEntry {
  actor: string;
  action: string;
  detail: string;
  timestamp: number;
}

export interface CounterClaim {
  counterClaimant: string;
  amount: number;
  reason: string;
  filedAt: number;
  accepted: boolean;
}

export interface SlaRecord {
  slaBlocks: number;
  breached: boolean;
  breachAt: number;
  penaltyApplied: boolean;
}

export interface Arbitrator {
  arbitratorId: number;
  tier: number;
  status: number;
  reputation: number;
  stakeAmount: number;
  registeredAt: number;
  lastCaseAt: number;
  specializations: string[];
  displayName: string;
  bio: string;
}

export interface ArbitratorPerformance {
  totalCases: number;
  casesResolved: number;
  casesOverturned: number;
  activeCases: number;
  avgResolutionTime: number;
  totalRewardsEarned: number;
  totalSlashed: number;
  favorableRatings: number;
  unfavorableRatings: number;
}

export interface CaseAssignment {
  arbitrator: string;
  assignedAt: number;
  acceptedAt: number;
  deadline: number;
  rewardAmount: number;
  completed: boolean;
}

export interface ArbitratorRating {
  arbitrator: string;
  rating: number;
  feedback: string;
  ratedAt: number;
}

export interface EvidenceItem {
  evidenceId: number;
  caseId: number;
  submitter: string;
  evidenceType: number;
  contentHash: string;
  encryptionKeyHash: string;
  ipfsCid: string;
  fileSize: number;
  description: string;
  submittedAt: number;
  verified: boolean;
  verifiedBy: string | null;
  verifiedAt: number;
  accessLevel: number;
}

export interface EvidenceChallenge {
  challenger: string;
  reason: string;
  challengedAt: number;
  resolved: boolean;
  upheld: boolean;
}

export interface CaseEvidenceSummary {
  documents: number;
  screenshots: number;
  transactions: number;
  communications: number;
  analyticsData: number;
  witnessStatements: number;
  totalSize: number;
  lastSubmitted: number;
}

export interface Judgment {
  judgmentId: number;
  caseId: number;
  arbitrator: string;
  claimant: string;
  respondent: string;
  outcome: number;
  amountAtStake: number;
  claimantAward: number;
  respondentAward: number;
  platformFee: number;
  penaltyType: number;
  penaltyTarget: string | null;
  penaltyAmount: number;
  reasoning: string;
  issuedAt: number;
  executed: boolean;
  executedAt: number;
  finalized: boolean;
}

export interface Appeal {
  appealId: number;
  judgmentId: number;
  caseId: number;
  appellant: string;
  grounds: string;
  status: number;
  appealRound: number;
  filedAt: number;
  decidedAt: number;
  decidedBy: string | null;
  newJudgmentId: number | null;
}

export interface SettlementOffer {
  amountToClaimant: number;
  amountToRespondent: number;
  offeredAt: number;
  accepted: boolean;
  acceptedAt: number;
}

export interface PenaltyLedger {
  totalWarnings: number;
  totalFines: number;
  totalFineAmount: number;
  suspensions: number;
  banned: boolean;
  lastPenaltyAt: number;
}

export interface MonthlyStats {
  judgmentsIssued: number;
  totalAwarded: number;
  totalPenalties: number;
  appealsFiled: number;
  appealsGranted: number;
  settlements: number;
}

export const DISPUTE_STATUS: Record<number, string> = {
  1: 'Filed',
  2: 'Acknowledged',
  3: 'Investigation',
  4: 'Arbitration',
  5: 'Resolved',
  6: 'Appealed',
  7: 'Closed',
  8: 'Dismissed',
};

export const DISPUTE_TYPES: Record<number, string> = {
  1: 'Payment',
  2: 'Fraud',
  3: 'Quality',
  4: 'Contract Breach',
  5: 'Misrepresentation',
  6: 'Non-Delivery',
};

export const SEVERITY_LEVELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Critical',
};

export const PRIORITY_LEVELS: Record<number, string> = {
  1: 'Normal',
  2: 'Elevated',
  3: 'Urgent',
  4: 'Emergency',
};

export const ARBITRATOR_TIERS: Record<number, string> = {
  1: 'Junior',
  2: 'Standard',
  3: 'Senior',
  4: 'Expert',
};

export const ARBITRATOR_STATUS: Record<number, string> = {
  1: 'Active',
  2: 'Suspended',
  3: 'Retired',
  4: 'Probation',
};

export const EVIDENCE_TYPES: Record<number, string> = {
  1: 'Document',
  2: 'Screenshot',
  3: 'Transaction',
  4: 'Communication',
  5: 'Analytics',
  6: 'Witness Statement',
};

export const ACCESS_LEVELS: Record<number, string> = {
  1: 'Parties Only',
  2: 'Arbitrator',
  3: 'Public',
};

export const OUTCOME_TYPES: Record<number, string> = {
  1: 'Claimant Wins',
  2: 'Respondent Wins',
  3: 'Split',
  4: 'Dismissed',
  5: 'Settlement',
};

export const PENALTY_TYPES: Record<number, string> = {
  0: 'None',
  1: 'Warning',
  2: 'Fine',
  3: 'Suspension',
  4: 'Ban',
};

export const APPEAL_STATUS: Record<number, string> = {
  1: 'Pending',
  2: 'Granted',
  3: 'Denied',
};
