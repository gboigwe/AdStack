/**
 * Clarity v4 Type Definitions
 * Comprehensive TypeScript types for Clarity v4 smart contracts
 */

export type ClarityValue =
  | UIntCV
  | IntCV
  | BoolCV
  | BufferCV
  | StringAsciiCV
  | StringUtf8CV
  | PrincipalCV
  | ListCV
  | TupleCV
  | ResponseCV
  | OptionalCV;

export interface UIntCV {
  type: 'uint';
  value: bigint;
}

export interface IntCV {
  type: 'int';
  value: bigint;
}

export interface BoolCV {
  type: 'bool';
  value: boolean;
}

export interface BufferCV {
  type: 'buffer';
  value: Uint8Array;
}

export interface StringAsciiCV {
  type: 'string-ascii';
  value: string;
}

export interface StringUtf8CV {
  type: 'string-utf8';
  value: string;
}

export interface PrincipalCV {
  type: 'principal';
  value: {
    address: string;
    contractName?: string;
  };
}

export interface ListCV {
  type: 'list';
  value: ClarityValue[];
}

export interface TupleCV {
  type: 'tuple';
  value: Record<string, ClarityValue>;
}

export interface ResponseCV {
  type: 'response';
  value: {
    ok: boolean;
    value: ClarityValue;
  };
}

export interface OptionalCV {
  type: 'optional';
  value: ClarityValue | null;
}

// Clarity v4 specific types
export interface StacksBlockTime {
  timestamp: number; // Unix timestamp in seconds
  blockHeight: number;
}

export interface ClarityV4TransactionOptions {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  network: any;
  anchorMode: number;
  postConditionMode: number;
  fee?: bigint;
  nonce?: bigint;
}

export interface ClarityV4ReadOnlyOptions {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  network: any;
  senderAddress: string;
}

// Campaign types with Clarity v4 fields
export interface Campaign {
  campaignId: number;
  advertiser: string;
  name: string;
  budget: bigint;
  spent: bigint;
  dailyBudget: bigint;
  startHeight: number;
  endHeight: number;
  status: string;
  createdAt: number; // stacks-block-time (Unix timestamp)
  lastUpdated: number; // stacks-block-time (Unix timestamp)
}

export interface AnalyticsMetrics {
  totalViews: bigint;
  validViews: bigint;
  clicks: bigint;
  conversions: bigint;
  spent: bigint;
  lastUpdated: number; // stacks-block-time
}

export interface UserProfile {
  status: string;
  roles: string[];
  joinHeight: number; // stacks-block-time
  lastActive: number; // stacks-block-time
  verificationStatus: string;
  verificationExpires: number; // stacks-block-time
  profilesCount: number;
  metadata?: string;
}

// Response types
export type ClarityResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ContractCallResponse = ClarityResponse<{
  txId: string;
  result: ClarityValue;
}>;

export type ReadOnlyResponse<T = any> = ClarityResponse<T>;
