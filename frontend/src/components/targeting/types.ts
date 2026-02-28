export interface TargetingRule {
  campaignId: number;
  segmentId: number;
  bidModifier: number;
  priority: number;
  active: boolean;
  dailyBudgetCap: number;
  dailySpend: number;
  createdAt: number;
}

export interface AudienceSegment {
  segmentId: number;
  owner: string;
  name: string;
  description: string;
  status: number;
  minAge: number;
  maxAge: number;
  locations: string[];
  requiredInterests: string[];
  excludedInterests: string[];
  minActivityScore: number;
  deviceTypes: number[];
  languageCodes: string[];
  incomeBracketMin: number;
  incomeBracketMax: number;
  genderTarget: number;
  estimatedSize: number;
  matchCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserInterestProfile {
  interests: string[];
  interestWeights: number[];
  age: number;
  location: string;
  activityScore: number;
  deviceType: string;
  language: string;
  incomeBracket: number;
  gender: number;
  lastUpdated: number;
}

export interface SegmentPerformance {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  avgEngagementTime: number;
  costPerAcquisition: number;
  totalSpend: number;
  lastPerformanceUpdate: number;
}

export interface MatchResult {
  score: number;
  tier: number;
}

export interface DemographicRule {
  ruleId: number;
  owner: string;
  name: string;
  criteriaType: number;
  minValue: number;
  maxValue: number;
  weight: number;
  active: boolean;
  createdAt: number;
}

export interface GeoRegion {
  regionCode: string;
  name: string;
  parentRegion: string;
  active: boolean;
  populationEstimate: number;
}

export interface ZkProofStatus {
  verified: boolean;
  criteriaType: number;
  submittedAt: number;
  expiresAt: number;
}

export interface SegmentMember {
  segmentId: number;
  member: string;
  status: number;
  similarityScore: number;
  joinedAt: number;
  expiresAt: number;
  interactionCount: number;
}

export interface SegmentAnalytics {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgSimilarity: number;
  reachRate: number;
  engagementRate: number;
  revenueGenerated: number;
  lastUpdated: number;
}

export interface LookalikeModel {
  modelId: number;
  sourceSegmentId: number;
  targetSegmentId: number;
  similarityThreshold: number;
  expansionFactor: number;
  membersFound: number;
  owner: string;
  createdAt: number;
}

export interface UserConsent {
  purpose: number;
  status: number;
  legalBasis: number;
  grantedAt: number;
  expiresAt: number;
  version: number;
  lastUpdated: number;
}

export interface ErasureRequest {
  requestId: number;
  user: string;
  status: number;
  requestedAt: number;
  deadline: number;
  completedAt: number;
  categoriesErased: string[];
}

export interface DataProcessor {
  name: string;
  purposes: number[];
  approved: boolean;
  dataCategories: string[];
  registeredAt: number;
  lastAudit: number;
}

export const CRITERIA_TYPES: Record<number, string> = {
  1: 'Age Range',
  2: 'Location',
  3: 'Interests',
  4: 'Behavior',
  5: 'Device',
  6: 'Language',
  7: 'Income Bracket',
  8: 'Gender',
};

export const SEGMENT_STATUS: Record<number, string> = {
  1: 'Active',
  2: 'Paused',
  3: 'Archived',
};

export const MATCH_TIERS: Record<number, string> = {
  0: 'None',
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Exact',
};

export const CONSENT_PURPOSES: Record<number, string> = {
  1: 'Targeting',
  2: 'Analytics',
  3: 'Personalization',
  4: 'Marketing',
  5: 'Measurement',
};

export const CONSENT_STATUS: Record<number, string> = {
  1: 'Granted',
  2: 'Denied',
  3: 'Withdrawn',
};

export const DEVICE_TYPES: Record<number, string> = {
  1: 'Desktop',
  2: 'Mobile',
  3: 'Tablet',
  4: 'Smart TV',
};

export const SEGMENT_TYPES: Record<number, string> = {
  1: 'Custom',
  2: 'Behavioral',
  3: 'Demographic',
  4: 'Lookalike',
  5: 'Retargeting',
};
