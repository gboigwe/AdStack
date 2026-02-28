import { CONTRACTS } from '@/lib/stacks-config';

export const TARGETING_CONTRACT = CONTRACTS.TARGETING_ENGINE;
export const SEGMENTS_CONTRACT = CONTRACTS.AUDIENCE_SEGMENTS;
export const PRIVACY_CONTRACT = CONTRACTS.PRIVACY_LAYER;

export const TARGETING_FUNCTIONS = {
  CREATE_SEGMENT: 'create-audience-segment',
  UPDATE_SEGMENT: 'update-segment-criteria',
  SET_USER_PROFILE: 'set-user-profile',
  ADD_TARGETING: 'add-targeting-criteria',
  MATCH_USER: 'match-user-to-segment',
  SUBMIT_ZK_PROOF: 'submit-zk-demographic-proof',
  VERIFY_ZK_PROOF: 'verify-zk-proof-for-segment',
  CREATE_RULE: 'create-demographic-rule',
  REGISTER_GEO: 'register-geo-region',
  EXCLUDE_USER: 'exclude-user-from-campaign',
  REMOVE_EXCLUSION: 'remove-user-exclusion',
  TRACK_IMPRESSION: 'track-segment-impression',
  TRACK_CLICK: 'track-segment-click',
  TRACK_CONVERSION: 'track-segment-conversion',
  UPDATE_STATUS: 'update-segment-status',
  DEACTIVATE_RULE: 'deactivate-targeting-rule',
} as const;

export const SEGMENTS_FUNCTIONS = {
  CREATE_SEGMENT: 'create-segment',
  ADD_MEMBER: 'add-member-to-segment',
  REMOVE_MEMBER: 'remove-member-from-segment',
  UPDATE_BEHAVIOR: 'update-behavior-profile',
  RECORD_INTERACTION: 'record-member-interaction',
  CREATE_LOOKALIKE: 'create-lookalike-model',
  EVALUATE_CANDIDATE: 'evaluate-lookalike-candidate',
  UPDATE_ANALYTICS: 'update-segment-analytics',
  RECORD_OVERLAP: 'record-segment-overlap',
  CLOSE_SEGMENT: 'close-segment',
  REOPEN_SEGMENT: 'reopen-segment',
} as const;

export const PRIVACY_FUNCTIONS = {
  GRANT_CONSENT: 'grant-consent',
  WITHDRAW_CONSENT: 'withdraw-consent',
  REGISTER_PROCESSOR: 'register-data-processor',
  REVOKE_PROCESSOR: 'revoke-data-processor',
  LOG_ACCESS: 'log-data-access',
  REQUEST_ERASURE: 'request-data-erasure',
  PROCESS_ERASURE: 'process-erasure-request',
  EXPORT_DATA: 'export-user-data',
  PUBLISH_POLICY: 'publish-privacy-policy',
} as const;

export const TARGETING_READ_ONLY = {
  GET_SEGMENT: 'get-segment',
  GET_USER_INTERESTS: 'get-user-interests',
  GET_TARGETING_RULE: 'get-targeting-rule',
  GET_PERFORMANCE: 'get-segment-performance',
  GET_CAMPAIGN_SEGMENTS: 'get-campaign-segments',
  GET_USER_MATCH: 'get-user-segment-match',
  IS_EXCLUDED: 'is-user-excluded',
  GET_MATCH_TIER: 'get-match-quality-tier',
  ESTIMATE_REACH: 'estimate-segment-reach',
  GET_TOTAL_MATCHES: 'get-total-matches',
  GET_TOTAL_SEGMENTS: 'get-total-segments',
} as const;
