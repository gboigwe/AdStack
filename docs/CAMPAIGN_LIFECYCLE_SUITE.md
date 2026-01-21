# Campaign Lifecycle Suite

## Overview

The Campaign Lifecycle Suite is a comprehensive set of smart contracts and frontend components that manage the complete lifecycle of advertising campaigns on the Stacks blockchain.

## Architecture

### Smart Contracts (10)

#### 1. campaign-lifecycle.clar
**Purpose**: Core state machine managing campaign transitions

**Key Features**:
- 6 campaign states (Draft → Funded → Active → Paused → Completed → Cancelled)
- Atomic state transitions with validation
- Auto-activation on funding threshold
- State history tracking

**Main Functions**:
- `create-campaign`: Initialize new campaign
- `fund-campaign`: Add funds and check threshold
- `activate-campaign`: Move from Funded to Active
- `pause-campaign`: Temporarily stop campaign
- `resume-campaign`: Restart paused campaign
- `complete-campaign`: Finalize successful campaign
- `cancel-campaign`: Abort campaign with refunds

#### 2. escrow-vault.clar
**Purpose**: Time-locked escrow with multi-party approval

**Key Features**:
- Time-lock mechanism
- Multi-signature approvals
- Performance-based releases
- Partial release support
- Expiration handling

**Main Functions**:
- `create-escrow`: Lock funds with conditions
- `release-escrow`: Full release after approval
- `partial-release`: Release portion of funds
- `approve-release`: Add approval signature
- `cancel-escrow`: Cancel and refund

#### 3. auction-engine.clar
**Purpose**: Real-time ad slot bidding system

**Key Features**:
- Dutch auction (descending price)
- English auction (ascending bids)
- Sealed bid auction
- Anti-sniping (5-minute extension)
- Bid bonds (10% requirement)

**Main Functions**:
- `create-auction`: Start new auction
- `place-bid`: Submit bid with bond
- `finalize-auction`: Award to winner
- `claim-winning-bid`: Winner claims slot
- `refund-losing-bids`: Return losing bids

#### 4. performance-oracle.clar
**Purpose**: On-chain performance tracking with fraud detection

**Key Features**:
- Merkle proof verification
- CTR/CVR calculation
- Fraud score assessment
- Publisher quality tracking
- View/click/conversion tracking

**Main Functions**:
- `submit-performance-report`: Oracle submits data
- `verify-merkle-proof`: Validate data integrity
- `calculate-ctr`: Compute click-through rate
- `detect-fraud`: Assess suspicious activity

#### 5. payout-automation.clar
**Purpose**: Automated payment distribution

**Key Features**:
- Batch processing (max 50 recipients)
- Scheduled payouts
- Performance-weighted distribution
- Publisher earnings tracking
- Gas optimization

**Main Functions**:
- `create-payout-batch`: Group recipients
- `execute-payout-batch`: Process payments
- `calculate-performance-payout`: Compute earnings
- `schedule-recurring-payout`: Set up automation

#### 6. campaign-extension.clar
**Purpose**: Mid-campaign updates for budget and duration

**Key Features**:
- Budget top-ups
- Duration extensions (max 30 days per request)
- Parameter updates
- Extension approval workflow

**Main Functions**:
- `request-budget-topup`: Add more funds
- `request-duration-extension`: Extend timeline
- `execute-budget-topup`: Apply budget increase
- `execute-duration-extension`: Apply time extension

#### 7. refund-processor.clar
**Purpose**: Conditional refunds with pro-rata calculations

**Key Features**:
- Pro-rata time-based refunds
- Fraud slashing (50% penalty)
- Dispute-based refunds
- Poor performance penalties (10%)

**Main Functions**:
- `request-refund`: Initiate refund process
- `calculate-prorata-refund`: Fair calculation
- `process-refund`: Execute refund
- `apply-fraud-penalty`: Slash for violations

#### 8. milestone-tracker.clar
**Purpose**: KPI monitoring with bonus unlocking

**Key Features**:
- 5 milestone types (views, clicks, conversions, CTR, revenue)
- Progress tracking
- Bonus distribution
- Achievement NFT minting
- Completion rate calculation

**Main Functions**:
- `create-milestone`: Define target
- `update-milestone-progress`: Track progress
- `claim-milestone-bonus`: Unlock rewards
- `get-campaign-completion-rate`: Calculate progress

#### 9. budget-optimizer.clar
**Purpose**: Dynamic budget allocation with ROI-based reallocation

**Key Features**:
- 4 optimization strategies (equal, performance-based, ROI-weighted, conversion-focused)
- Channel performance tracking
- Reallocation cooldown (24 hours)
- Min ROI threshold (50%)

**Main Functions**:
- `initialize-campaign-budget`: Set budget
- `create-allocation`: Assign to channel
- `update-allocation-performance`: Track ROI
- `reallocate-budget`: Move funds to better performers
- `calculate-optimal-allocation`: Suggest distribution

#### 10. campaign-analytics-v4.clar
**Purpose**: Enhanced analytics with real-time aggregation

**Key Features**:
- Real-time metrics (views, clicks, conversions, revenue, spend)
- Derived metrics (CTR, CVR, ROI, ROAS, CPM, CPC, CPA)
- Time-series snapshots
- Channel analytics
- Geographic analytics
- Device analytics
- Conversion funnel tracking
- Cohort analysis

**Main Functions**:
- `update-campaign-metrics`: Real-time updates
- `create-snapshot`: Take time-series snapshot
- `update-channel-metrics`: Track per-channel performance
- `update-geographic-metrics`: Track by location
- `update-device-metrics`: Track by device type
- `update-conversion-funnel`: Track funnel stages
- `calculate-growth-rate`: Period-over-period comparison

### Frontend Components (4)

#### 1. CampaignWizard.tsx
Multi-step campaign creation wizard with:
- Basic information (name, description)
- Budget & timeline setup
- Target audience definition
- Objectives & channels selection
- Review and submission

#### 2. CampaignDashboard.tsx
Real-time campaign monitoring with:
- Campaign list with filtering
- Live metrics updates (30s refresh)
- Progress tracking
- Budget utilization
- State management controls
- Detailed campaign view modal

#### 3. EscrowMonitor.tsx
Escrow tracking and management with:
- Escrow status monitoring
- Release progress tracking
- Approval management
- Partial release functionality
- Time-lock countdown

#### 4. PayoutHistory.tsx
Payment tracking and reporting with:
- Individual payout view
- Batch payout view
- Status filtering
- Search functionality
- Export capabilities
- Summary statistics

### Contract Interaction Utilities (3)

#### 1. campaign-lifecycle.ts
TypeScript SDK for campaign management:
- State transition helpers
- Post-condition builders
- Type definitions
- Validation utilities

#### 2. escrow-vault.ts
TypeScript SDK for escrow operations:
- Escrow creation
- Release management
- Approval workflows
- Status utilities

#### 3. payout-automation.ts
TypeScript SDK for payout management:
- Batch creation
- Execution helpers
- Performance calculations
- Amount formatting

## Integration Guide

### 1. Deploy Contracts

```bash
clarinet deployments apply -p deployments/default.mainnet-plan.yaml
```

### 2. Configure Frontend

```typescript
// .env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD
NEXT_PUBLIC_NETWORK=mainnet
```

### 3. Initialize Campaign

```typescript
import { createCampaign } from '@/lib/contracts/campaign-lifecycle';

await createCampaign({
  name: "Summer Sale 2026",
  budget: 10000000000n, // 10,000 STX
  fundingThreshold: 8000000000n, // 8,000 STX
  startTime: Math.floor(Date.now() / 1000),
  endTime: Math.floor(Date.now() / 1000) + 2592000, // 30 days
  metadata: JSON.stringify({ description: "..." }),
  network: getStacksNetwork(),
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
});
```

### 4. Create Escrow

```typescript
import { createEscrow } from '@/lib/contracts/escrow-vault';

await createEscrow({
  campaignId: 1,
  beneficiary: "SP...",
  amount: 5000000000n,
  timeLockDuration: 86400, // 24 hours
  performanceThreshold: 80, // 80%
  expiresIn: 2592000, // 30 days
  requiredApprovers: ["SP...1", "SP...2"],
  network: getStacksNetwork(),
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  userAddress: address
});
```

### 5. Track Performance

```typescript
import { submitPerformanceReport } from '@/lib/contracts/performance-oracle';

await submitPerformanceReport({
  campaignId: 1,
  views: 10000,
  clicks: 450,
  conversions: 23,
  merkleRoot: "0x...",
  network: getStacksNetwork(),
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
});
```

### 6. Process Payouts

```typescript
import { createPayoutBatch, executePayoutBatch } from '@/lib/contracts/payout-automation';

// Create batch
await createPayoutBatch({
  campaignId: 1,
  recipients: [
    { recipient: "SP...1", amount: 500000000n },
    { recipient: "SP...2", amount: 750000000n }
  ],
  network: getStacksNetwork(),
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
});

// Execute batch
await executePayoutBatch({
  batchId: 1,
  network: getStacksNetwork(),
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
});
```

## Testing

### Run Contract Tests

```bash
clarinet test
```

### Run Frontend Tests

```bash
npm test
```

## Security Considerations

1. **Authorization**: All critical functions restricted to contract owner or authorized principals
2. **Post-Conditions**: STX transfers protected with post-conditions
3. **State Validation**: State transitions validated before execution
4. **Overflow Protection**: Safe arithmetic operations
5. **Reentrancy**: Single-entry state machine pattern
6. **Time-locks**: Escrow releases protected by time constraints
7. **Multi-sig**: Critical operations require multiple approvals
8. **Fraud Detection**: Performance oracle monitors suspicious activity

## Gas Optimization

1. **Batch Processing**: Group operations to reduce transaction count
2. **Efficient Storage**: Optimized data structures
3. **Lazy Evaluation**: Calculate on-demand when possible
4. **Index Optimization**: Efficient lookup patterns
5. **Pruning**: Remove stale data

## Roadmap

- [ ] Add AI-powered budget optimization
- [ ] Implement cross-chain bridges
- [ ] Add L2 scaling support
- [ ] Build mobile apps
- [ ] Add advanced analytics dashboard
- [ ] Implement automated A/B testing
- [ ] Add fraud prevention ML models

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/AdStack/issues
- Discord: https://discord.gg/adstack
- Docs: https://docs.adstack.io
