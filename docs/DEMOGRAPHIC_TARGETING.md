# Demographic Targeting Engine

## Overview

The Advanced Demographic Targeting Engine provides privacy-preserving audience segmentation, multi-dimensional relevance scoring, and GDPR-compliant consent management for the AdStack decentralized advertising platform.

The system consists of three smart contracts and twelve frontend components working together to enable advertisers to define audience segments, match users to campaigns based on demographic criteria, and ensure all data processing complies with privacy regulations.

## Architecture

### Smart Contracts

**targeting-engine.clar** (v2.0.0)
Core contract handling audience segment definitions, multi-dimensional relevance scoring, user-to-segment matching, ZK proof verification, geo-region management, and exclusion lists.

- 13 data maps tracking segments, user interests, targeting rules, performance metrics, exclusions, ZK proofs, demographic rules, geo regions, cooldowns, and daily stats
- 5-dimension relevance scoring: age, activity, device, language, income
- 4 match quality tiers: Exact (80+), High (60+), Medium (40+), Low (20+)
- Match cooldown system preventing excessive re-matching
- Daily budget caps on targeting rules

**audience-segments.clar**
Manages segment membership lifecycle, behavioral profiling, lookalike audience modeling, and segment overlap analysis.

- 5 segment types: Custom, Behavioral, Demographic, Lookalike, Retargeting
- 3 membership states: Active, Expired, Removed
- Behavioral signal tracking per segment
- Lookalike model creation with similarity thresholds and expansion factors
- Segment overlap calculation between any two segments

**privacy-layer.clar**
GDPR-compliant consent management with audit trails, data processor registry, erasure request workflows, and data portability.

- 5 consent purposes: Targeting, Analytics, Personalization, Marketing, Measurement
- Consent history audit trail with immutable records
- Data processor registry with approval/revocation
- Erasure request workflow: Pending -> Processing -> Completed/Denied
- Data portability export tracking
- Privacy policy versioning

### Frontend Components

| Component | Purpose |
|---|---|
| `TargetingRuleBuilder` | Define audience targeting criteria per campaign |
| `AudienceSegmentCreator` | Build custom audience segments with interest taxonomy |
| `PrivacySettingsUI` | GDPR consent management with per-purpose toggles |
| `TargetingPreview` | Preview match tier distribution and per-user scores |
| `ConsentManagement` | Track consent coverage and audit history |
| `SegmentAnalyticsPanel` | Cross-segment performance comparison |
| `MatchRateCalculator` | Per-criteria match rate estimation |
| `GeoTargetingMap` | Region selector with tier-based pricing |
| `DeviceSelector` | Device type targeting with audience share metrics |
| `InterestTaxonomy` | Hierarchical interest category browser |
| `ExclusionListManager` | Manage excluded addresses |
| `TargetingPerformanceMetrics` | KPI dashboard with daily breakdowns |

## Data Flow

```
Advertiser                    Targeting Engine                    Users
    |                               |                              |
    |-- create-audience-segment --> |                              |
    |-- add-targeting-criteria ---> |                              |
    |                               |                              |
    |                               | <-- set-user-profile --------|
    |                               | <-- submit-zk-proof ---------|
    |                               |                              |
    |-- match-user-to-segment ----> |                              |
    |                               |-- calculate-relevance-score  |
    |                               |-- score-to-tier              |
    |                               |-- update-match-cooldown      |
    |                               |                              |
    | <---- { score, tier } --------|                              |
```

## Relevance Scoring

The multi-dimensional scoring system evaluates users against segment criteria:

| Dimension | Max Points | Scoring Logic |
|---|---|---|
| Age | 25 | Full points if within range, 10 if within 5 years |
| Activity | 20 | Full points if above minimum, 10 if above half |
| Device | 15 | Points awarded if user device matches allowed types |
| Language | 15 | Points awarded if user language is in allowed list |
| Income | 15 | Full points if within bracket, 5 if within 2x range |
| **Total** | **90** | Capped at 100 |

Tier thresholds:
- **Exact** (score >= 80): Perfect demographic alignment
- **High** (score >= 60): Strong match across most dimensions
- **Medium** (score >= 40): Partial match worth considering
- **Low** (score >= 20): Marginal match for broad campaigns

## Contract Interactions

### Creating a Segment

```clarity
(contract-call? .targeting-engine create-audience-segment
    u"Tech Enthusiasts 25-35"
    u"Active technology users in North America"
    u18           ;; min-age
    u45           ;; max-age
    (list "US" "CA" "UK")
    (list "blockchain" "defi" "web3")
    (list)        ;; no excluded interests
    u50           ;; min activity score
    (list u1 u2)  ;; desktop, mobile
    (list "en")
    u3            ;; income bracket min
    u8            ;; income bracket max
    u0            ;; any gender
)
```

### Granting Consent

```clarity
(contract-call? .privacy-layer grant-consent
    u1            ;; purpose: TARGETING
    u1            ;; policy version
    u"I consent to demographic targeting"
)
```

### Creating a Lookalike Model

```clarity
(contract-call? .audience-segments create-lookalike-model
    u1            ;; source segment id
    u"Crypto Lookalike"
    u70           ;; similarity threshold (%)
    u300          ;; expansion factor (3x)
    u50           ;; interest weight
    u30           ;; behavior weight
    u20           ;; demographic weight
)
```

## Error Codes

### targeting-engine.clar
| Code | Constant | Description |
|---|---|---|
| u100 | err-owner-only | Caller is not the contract owner |
| u101 | err-not-found | Resource not found |
| u102 | err-unauthorized | Caller lacks permission |
| u103 | err-invalid-criteria | Invalid targeting criteria |
| u104 | err-segment-full | Segment at maximum capacity |
| u105 | err-already-exists | Resource already exists |
| u106 | err-invalid-score | Score out of valid range |
| u107 | err-invalid-proof | ZK proof is invalid |
| u108 | err-expired-proof | ZK proof has expired |
| u109 | err-segment-inactive | Segment is not active |
| u110 | err-cooldown-active | Match cooldown has not elapsed |
| u111 | err-budget-exceeded | Daily budget cap exceeded |
| u112 | err-invalid-geo | Invalid geographic region |
| u113 | err-invalid-device | Invalid device type |

### audience-segments.clar
| Code | Constant | Description |
|---|---|---|
| u200 | err-owner-only | Caller is not the contract owner |
| u201 | err-unauthorized | Caller lacks permission |
| u202 | err-not-found | Segment not found |
| u203 | err-invalid-params | Invalid parameters |
| u204 | err-segment-full | Segment at max members |
| u205 | err-already-member | User already a member |
| u206 | err-not-member | User is not a member |
| u207 | err-segment-closed | Segment is closed |
| u208 | err-invalid-score | Score out of range |
| u209 | err-model-exists | Lookalike model already exists |
| u210 | err-invalid-weights | Weights do not sum to 100 |

### privacy-layer.clar
| Code | Constant | Description |
|---|---|---|
| u300 | err-owner-only | Caller is not the contract owner |
| u301 | err-unauthorized | Caller lacks permission |
| u302 | err-not-found | Resource not found |
| u303 | err-invalid-purpose | Invalid consent purpose |
| u304 | err-already-granted | Consent already active |
| u305 | err-not-granted | No active consent to withdraw |
| u306 | err-processor-exists | Processor already registered |
| u307 | err-invalid-status | Invalid erasure request status |
| u308 | err-request-exists | Erasure request already pending |
| u309 | err-expired | Consent has expired |
| u310 | err-invalid-policy | Invalid privacy policy |

## Frontend Usage

All components are available through the barrel export:

```typescript
import {
  TargetingRuleBuilder,
  AudienceSegmentCreator,
  PrivacySettingsUI,
  TargetingPreview,
  ConsentManagement,
  SegmentAnalyticsPanel,
  MatchRateCalculator,
  GeoTargetingMap,
  DeviceSelector,
  InterestTaxonomy,
  ExclusionListManager,
  TargetingPerformanceMetrics,
} from '@/components/targeting';
```

Shared types are also exported:

```typescript
import type {
  TargetingRule,
  AudienceSegment,
  MatchResult,
  GeoRegion,
  UserConsent,
  SegmentAnalytics,
} from '@/components/targeting';
```

## Testing

Run the contract tests:

```bash
npx vitest run tests/targeting-engine.test.ts
npx vitest run tests/audience-segments.test.ts
npx vitest run tests/privacy-layer.test.ts
```

Or run all tests:

```bash
npm test
```
