# Publisher Verification & KYC System

Complete guide to the AdStack publisher verification and KYC compliance system.

## Overview

The Publisher Verification & KYC System provides a multi-tier verification framework for publishers, ensuring trust, compliance, and quality across the AdStack network.

## Smart Contracts

### 1. publisher-verification.clar

Multi-tier publisher verification with domain proof and staking mechanisms.

**Key Features:**
- 4-tier verification system (Unverified, Basic, Verified, Premium)
- Domain ownership verification (DNS, Meta Tag, File)
- Staking requirements (1,000 / 5,000 / 10,000 STX)
- Traffic verification thresholds (10k / 100k / 1M monthly views)
- Tier upgrade request system

**Public Functions:**
```clarity
(register-publisher (domain (string-ascii 128)))
(create-domain-challenge (publisher-id uint) (verification-method (string-ascii 32)))
(verify-domain (publisher-id uint) (proof (string-ascii 256)))
(stake-for-tier (publisher-id uint) (target-tier uint) (amount uint))
(submit-traffic-data (publisher-id uint) (month uint) (views uint) (unique-visitors uint))
(request-tier-upgrade (publisher-id uint) (target-tier uint))
(approve-tier-upgrade (publisher-id uint) (request-id uint))
```

**Read-Only Functions:**
```clarity
(get-publisher (publisher-id uint))
(get-publisher-by-address (owner principal))
(get-domain-challenge (publisher-id uint))
(get-traffic-record (publisher-id uint) (month uint))
(get-stake (publisher-id uint))
(get-tier-name (tier uint))
```

### 2. kyc-registry.clar

Privacy-preserving KYC storage with authorized verifier integration.

**Key Features:**
- 4 compliance levels (None, Basic, Standard, Enhanced)
- Document hash storage (not actual documents)
- Authorized third-party verifier system
- Verification history tracking
- Regulatory reporting capabilities
- KYC renewal and status management

**Public Functions:**
```clarity
(add-verifier (verifier principal) (name (string-ascii 128)))
(submit-kyc-verification (user principal) (compliance-level uint) (document-hash (buff 32)) ...)
(update-kyc-status (user principal) (new-status (string-ascii 32)) (notes (string-ascii 256)))
(renew-kyc (user principal) (additional-days uint))
(flag-kyc-for-review (user principal) (reason (string-ascii 256)))
(generate-regulatory-report (...))
```

**Read-Only Functions:**
```clarity
(get-kyc-record (user principal))
(is-kyc-valid (user principal))
(get-compliance-level (user principal))
(get-risk-score (user principal))
```

### 3. publisher-reputation.clar

On-chain reputation scoring with performance-based tier progression.

**Key Features:**
- 5 reputation tiers (Novice, Bronze, Silver, Gold, Platinum)
- Score thresholds (0, 100, 250, 500, 1000)
- Campaign outcome tracking
- Penalty and reward system
- Fraud flagging mechanism
- Performance metrics recording

**Public Functions:**
```clarity
(initialize-reputation (publisher principal))
(update-score (publisher principal) (score-change int) (reason (string-ascii 256)))
(record-campaign-outcome (publisher principal) (campaign-id uint) (successful bool) ...)
(apply-penalty (publisher principal) (reason (string-ascii 256)) (score-deduction uint) ...)
(award-bonus (publisher principal) (reason (string-ascii 256)) (score-addition uint) ...)
(flag-fraud (publisher principal) (evidence (string-ascii 256)))
(record-performance (publisher principal) (period uint) ...)
```

**Read-Only Functions:**
```clarity
(get-reputation (publisher principal))
(get-reputation-score (publisher principal))
(get-tier (publisher principal))
(get-success-rate (publisher principal))
```

## Frontend Components

### PublisherOnboarding.tsx

Multi-step wizard for publisher onboarding.

**Features:**
- Welcome screen with benefits overview
- Domain registration
- Ownership verification
- KYC completion

**Usage:**
```tsx
import { PublisherOnboarding } from '@/components/publisher/PublisherOnboarding';

<PublisherOnboarding />
```

### DomainVerification.tsx

Domain ownership verification interface.

**Methods Supported:**
- DNS TXT Record
- HTML Meta Tag
- Verification File

**Props:**
```tsx
interface DomainVerificationProps {
  publisherId: number;
  domain: string;
  onVerified?: () => void;
}
```

### KYCUpload.tsx

KYC document upload with encryption.

**Features:**
- Compliance level selection
- Document upload (encrypted)
- Hash-only on-chain storage
- Country selection
- Privacy notices

**Props:**
```tsx
interface KYCUploadProps {
  publisherId: number;
  onComplete?: () => void;
}
```

### VerificationStatus.tsx

Comprehensive verification status dashboard.

**Displays:**
- Publisher tier
- KYC status
- Reputation score
- Verification checklist
- Performance metrics

### ReputationBadge.tsx

Reputation tier badge with progression display.

**Props:**
```tsx
interface ReputationBadgeProps {
  score: number;
  tier: number;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}
```

## Integration Library

### publisher-contracts.ts

TypeScript utilities for contract interaction.

**Functions:**
```typescript
// Publisher Verification
registerPublisher(domain, senderKey, network)
createDomainChallenge(publisherId, verificationMethod, senderKey, network)
stakeForTier(publisherId, targetTier, amount, senderKey, network)
requestTierUpgrade(publisherId, targetTier, senderKey, network)

// KYC Registry
submitKYCVerification(complianceLevel, documentHash, countryCode, riskScore, validityDays, senderKey, network)
getKYCRecord(userAddress, network)
isKYCValid(userAddress, network)

// Reputation
initializeReputation(publisher, senderKey, network)
getReputation(publisher, network)
getReputationScore(publisher, network)
getSuccessRate(publisher, network)
```

## Verification Tiers

### Unverified (Tier 0)
- No requirements
- Limited access
- Cannot receive payouts

### Basic (Tier 1)
- Domain verified
- 1,000 STX stake
- 10k monthly views
- Basic publisher features

### Verified (Tier 2)
- All Basic requirements
- KYC verification (Standard level)
- 5,000 STX stake
- 100k monthly views
- Verified badge
- 5% higher revenue share

### Premium (Tier 3)
- All Verified requirements
- Enhanced KYC
- 10,000 STX stake
- 1M+ monthly views
- Premium badge
- 10% higher revenue share
- Priority support

## KYC Compliance Levels

### Level 0: None
- No verification
- Basic platform access

### Level 1: Basic
- Email verification only
- Limited features

### Level 2: Standard
- Government-issued ID
- Proof of address
- Standard compliance

### Level 3: Enhanced
- Full due diligence
- Business verification
- Tax documentation
- Enterprise features

## Reputation Scoring

### Scoring System
- Initial score: 0
- Range: 0 - unlimited
- Campaign success: +10 points
- Campaign failure: -5 points
- Fraud flag: -50 points

### Tier Progression
- **Novice** (0-99): Entry level
- **Bronze** (100-249): Established publishers
- **Silver** (250-499): Trusted publishers
- **Gold** (500-999): Premium publishers
- **Platinum** (1000+): Elite publishers

## Security & Privacy

### Document Storage
- Documents encrypted before upload to Gaia
- Only document hashes stored on-chain
- GDPR compliant
- Privacy-preserving verification

### Staking Security
- Funds locked in contract
- 30-day unlock period
- Penalty slashing for fraud
- Automated refunds on tier downgrade

### Verifier Authorization
- Only authorized verifiers can submit KYC
- Verifier reputation tracking
- Admin-controlled verifier list

## Deployment

### Testnet
```bash
clarinet integrate
```

### Mainnet
```bash
clarinet deployment generate --mainnet
clarinet deployment apply -p deployments/default.mainnet-plan.yaml
```

### Contract Addresses
```
Publisher Verification: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.publisher-verification
KYC Registry: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.kyc-registry
Publisher Reputation: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.publisher-reputation
```

## Testing

### Contract Tests
```bash
clarinet test
```

### Integration Tests
```bash
npm run test:integration
```

## API Examples

### Register a Publisher
```typescript
import { registerPublisher } from '@/lib/publisher-contracts';
import { StacksTestnet } from '@stacks/network';

const network = new StacksTestnet();
const result = await registerPublisher(
  'example.com',
  'your-private-key',
  network
);
```

### Check KYC Status
```typescript
import { isKYCValid } from '@/lib/publisher-contracts';

const isValid = await isKYCValid(
  'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
  network
);
```

### Get Reputation Score
```typescript
import { getReputationScore } from '@/lib/publisher-contracts';

const score = await getReputationScore(
  'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
  network
);
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/gboigwe/AdStack/issues
- Documentation: https://docs.adstack.xyz
- Discord: https://discord.gg/adstack

## License

MIT License - see LICENSE file for details
