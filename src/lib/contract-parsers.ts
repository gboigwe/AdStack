/**
 * Contract Response Parsers
 * Convert raw Clarity read-only responses into typed frontend objects.
 * Each parser handles the kebab-case to camelCase mapping and bigint
 * to number conversion for fields that fit safely in JS numbers.
 */

import { UserRole, VerificationStatus } from '@/types/contracts';
import type {
  UserProfile,
  RawClarityProfile,
  RawClarityUserCounts,
  UserCounts,
} from '@/types/contracts';

// --- Role mapping ---

const ROLE_MAP: Record<number, UserRole> = {
  1: UserRole.ADVERTISER,
  2: UserRole.PUBLISHER,
  3: UserRole.VIEWER,
};

const STATUS_MAP: Record<number, UserProfile['status']> = {
  1: 'active',
  2: 'inactive',
  3: 'suspended',
};

const VERIFICATION_MAP: Record<number, VerificationStatus> = {
  0: VerificationStatus.UNVERIFIED,
  1: VerificationStatus.PENDING,
  2: VerificationStatus.VERIFIED,
  3: VerificationStatus.REJECTED,
};

/**
 * Parse a raw Clarity profile response into a typed UserProfile.
 * @param address - The Stacks address that owns this profile
 * @param raw - The raw Clarity map response with kebab-case keys
 */
export function parseUserProfile(
  address: string,
  raw: RawClarityProfile,
): UserProfile {
  const roleNum = Number(raw.role);
  const statusNum = Number(raw.status);
  const verNum = Number(raw['verification-status']);

  return {
    address,
    displayName: raw['display-name'],
    role: ROLE_MAP[roleNum] ?? UserRole.VIEWER,
    status: STATUS_MAP[statusNum] ?? 'active',
    verificationStatus: VERIFICATION_MAP[verNum] ?? VerificationStatus.UNVERIFIED,
    verificationExpires: Number(raw['verification-expires']),
    reputationScore: Number(raw['reputation-score']),
    joinHeight: Number(raw['join-height']),
    lastActive: Number(raw['last-active']),
    totalCampaigns: Number(raw['total-campaigns']),
    totalEarnings: raw['total-earnings'],
  };
}

/**
 * Parse raw user counts from the contract into typed UserCounts.
 */
export function parseUserCounts(raw: RawClarityUserCounts): UserCounts {
  return {
    total: Number(raw.total),
    advertisers: Number(raw.advertisers),
    publishers: Number(raw.publishers),
    viewers: Number(raw.viewers),
  };
}
