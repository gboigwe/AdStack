# Campaign Lifecycle Suite API Reference

## Table of Contents

1. [Campaign Lifecycle](#campaign-lifecycle)
2. [Escrow Vault](#escrow-vault)
3. [Auction Engine](#auction-engine)
4. [Performance Oracle](#performance-oracle)
5. [Payout Automation](#payout-automation)
6. [Campaign Extension](#campaign-extension)
7. [Refund Processor](#refund-processor)
8. [Milestone Tracker](#milestone-tracker)
9. [Budget Optimizer](#budget-optimizer)
10. [Campaign Analytics](#campaign-analytics)

---

## Campaign Lifecycle

### create-campaign

Creates a new campaign with initial parameters.

**Parameters**:
- `name` (string-ascii 64): Campaign name
- `budget` (uint): Total budget in microSTX
- `funding-threshold` (uint): Minimum funding to activate
- `start-time` (uint): Unix timestamp for start
- `end-time` (uint): Unix timestamp for end
- `metadata` (string-ascii 256): JSON metadata

**Returns**: `(ok uint)` - Campaign ID

**Errors**:
- `ERR_UNAUTHORIZED` (u1000): Not contract owner
- `ERR_INVALID_PARAMS` (u1001): Invalid parameters

**Example**:
```clarity
(contract-call? .campaign-lifecycle create-campaign
  "Summer Sale 2026"
  u10000000000
  u8000000000
  u1672531200
  u1675209600
  "{\"description\":\"Summer sale campaign\"}"
)
```

### fund-campaign

Add funds to campaign and auto-activate when threshold met.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `amount` (uint): Funding amount in microSTX

**Returns**: `(ok bool)`

**Errors**:
- `ERR_CAMPAIGN_NOT_FOUND` (u1002): Invalid campaign ID
- `ERR_INVALID_STATE` (u1003): Cannot fund in current state

**Example**:
```clarity
(contract-call? .campaign-lifecycle fund-campaign u1 u5000000000)
```

### activate-campaign

Manually activate a funded campaign.

**Parameters**:
- `campaign-id` (uint): Campaign identifier

**Returns**: `(ok bool)`

**Errors**:
- `ERR_CAMPAIGN_NOT_FOUND` (u1002)
- `ERR_INVALID_STATE` (u1003)
- `ERR_UNAUTHORIZED` (u1000)

---

## Escrow Vault

### create-escrow

Create time-locked escrow with approval requirements.

**Parameters**:
- `campaign-id` (uint): Associated campaign
- `beneficiary` (principal): Recipient address
- `amount` (uint): Escrowed amount
- `time-lock-duration` (uint): Lock period in seconds
- `performance-threshold` (uint): Required performance %
- `expires-in` (uint): Expiration period
- `required-approvers-list` (list 10 principal): Approver addresses

**Returns**: `(ok uint)` - Escrow ID

**Errors**:
- `ERR_UNAUTHORIZED` (u2000)
- `ERR_INVALID_AMOUNT` (u2001)
- `ERR_TOO_MANY_APPROVERS` (u2002)

**Example**:
```clarity
(contract-call? .escrow-vault create-escrow
  u1
  'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7
  u5000000000
  u86400
  u80
  u2592000
  (list 'SP...1 'SP...2)
)
```

### release-escrow

Release all escrowed funds to beneficiary.

**Parameters**:
- `escrow-id` (uint): Escrow identifier

**Returns**: `(ok bool)`

**Errors**:
- `ERR_ESCROW_NOT_FOUND` (u2003)
- `ERR_TIME_LOCKED` (u2004)
- `ERR_INSUFFICIENT_APPROVALS` (u2005)
- `ERR_EXPIRED` (u2006)

### partial-release

Release portion of escrowed funds.

**Parameters**:
- `escrow-id` (uint): Escrow identifier
- `amount` (uint): Amount to release

**Returns**: `(ok bool)`

**Errors**:
- `ERR_INSUFFICIENT_BALANCE` (u2007)
- Same as `release-escrow`

---

## Auction Engine

### create-auction

Start new auction for ad slot.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `auction-type` (uint): 1=Dutch, 2=English, 3=Sealed
- `start-price` (uint): Initial/reserve price
- `reserve-price` (uint): Minimum acceptable
- `dutch-price-decay` (uint): Price decrease per block (Dutch only)
- `duration` (uint): Auction duration in seconds

**Returns**: `(ok uint)` - Auction ID

**Errors**:
- `ERR_UNAUTHORIZED` (u3000)
- `ERR_INVALID_AUCTION_TYPE` (u3001)

**Example**:
```clarity
(contract-call? .auction-engine create-auction
  u1
  u1  ;; Dutch auction
  u1000000000
  u500000000
  u10000
  u3600
)
```

### place-bid

Submit bid with required bond.

**Parameters**:
- `auction-id` (uint): Auction identifier
- `bid-amount` (uint): Bid price

**Returns**: `(ok bool)`

**Errors**:
- `ERR_AUCTION_NOT_FOUND` (u3002)
- `ERR_AUCTION_ENDED` (u3003)
- `ERR_BID_TOO_LOW` (u3004)
- `ERR_INSUFFICIENT_BOND` (u3005)

---

## Performance Oracle

### submit-performance-report

Oracle submits verified performance data.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `views` (uint): Total views
- `clicks` (uint): Total clicks
- `conversions` (uint): Total conversions
- `merkle-root` (buff 32): Data integrity proof

**Returns**: `(ok bool)`

**Errors**:
- `ERR_UNAUTHORIZED` (u4000): Not oracle
- `ERR_CAMPAIGN_NOT_FOUND` (u4001)
- `ERR_INVALID_METRICS` (u4002)

**Example**:
```clarity
(contract-call? .performance-oracle submit-performance-report
  u1
  u10000
  u450
  u23
  0x1234...
)
```

### verify-merkle-proof

Verify performance data authenticity.

**Parameters**:
- `leaf` (buff 32): Data hash
- `proof` (list 10 (buff 32)): Merkle proof path
- `root` (buff 32): Merkle root

**Returns**: `(ok bool)`

---

## Payout Automation

### create-payout-batch

Group recipients for batch processing.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `recipients` (list 50 {recipient: principal, amount: uint}): Payout list

**Returns**: `(ok uint)` - Batch ID

**Errors**:
- `ERR_UNAUTHORIZED` (u5000)
- `ERR_TOO_MANY_RECIPIENTS` (u5001)
- `ERR_INSUFFICIENT_FUNDS` (u5002)

**Example**:
```clarity
(contract-call? .payout-automation create-payout-batch
  u1
  (list
    {recipient: 'SP...1, amount: u500000000}
    {recipient: 'SP...2, amount: u750000000}
  )
)
```

### execute-payout-batch

Process all payouts in batch.

**Parameters**:
- `batch-id` (uint): Batch identifier

**Returns**: `(ok bool)`

**Errors**:
- `ERR_BATCH_NOT_FOUND` (u5003)
- `ERR_ALREADY_EXECUTED` (u5004)

### calculate-performance-payout

Compute earnings based on performance.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `publisher` (principal): Publisher address
- `views` (uint): Views delivered
- `clicks` (uint): Clicks delivered
- `quality-score` (uint): Quality rating (0-100)

**Returns**: `(ok uint)` - Calculated payout amount

---

## Campaign Extension

### request-budget-topup

Request additional campaign funding.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `additional-budget` (uint): Amount to add

**Returns**: `(ok uint)` - Extension ID

**Errors**:
- `ERR_UNAUTHORIZED` (u6000)
- `ERR_CAMPAIGN_NOT_FOUND` (u6001)
- `ERR_INVALID_AMOUNT` (u6002)

### request-duration-extension

Request campaign timeline extension.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `additional-duration` (uint): Seconds to add (max 2592000)

**Returns**: `(ok uint)` - Extension ID

**Errors**:
- `ERR_EXTENSION_TOO_LONG` (u6003)

### execute-budget-topup

Apply approved budget increase.

**Parameters**:
- `extension-id` (uint): Extension identifier

**Returns**: `(ok bool)`

---

## Refund Processor

### request-refund

Initiate campaign refund.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `reason` (string-ascii 128): Refund reason

**Returns**: `(ok uint)` - Refund ID

**Errors**:
- `ERR_UNAUTHORIZED` (u7000)
- `ERR_NO_REFUND_AVAILABLE` (u7001)

### calculate-prorata-refund

Calculate fair refund amount.

**Parameters**:
- `total-budget` (uint): Original budget
- `amount-spent` (uint): Amount already spent
- `time-elapsed` (uint): Time campaign ran
- `total-duration` (uint): Planned duration

**Returns**: `uint` - Refund amount

**Example**:
```clarity
(contract-call? .refund-processor calculate-prorata-refund
  u10000000000  ;; 10,000 STX budget
  u4000000000   ;; 4,000 STX spent
  u864000       ;; 10 days elapsed
  u2592000      ;; 30 day duration
)
;; Returns: u4000000000 (40% time used, 40% budget spent = full refund)
```

---

## Milestone Tracker

### create-milestone

Define achievement target with bonus.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `milestone-type` (uint): 1=views, 2=clicks, 3=conversions, 4=CTR, 5=revenue
- `target-value` (uint): Target to achieve
- `bonus-amount` (uint): Reward for achievement
- `description` (string-ascii 256): Milestone description

**Returns**: `(ok uint)` - Milestone ID

**Example**:
```clarity
(contract-call? .milestone-tracker create-milestone
  u1
  u2  ;; Clicks milestone
  u10000  ;; Target: 10,000 clicks
  u500000000  ;; Bonus: 500 STX
  "Reach 10k clicks milestone"
)
```

### update-milestone-progress

Update progress and check achievement.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `milestone-id` (uint): Milestone identifier
- `views` (uint): Current views
- `clicks` (uint): Current clicks
- `conversions` (uint): Current conversions
- `revenue` (uint): Current revenue

**Returns**: `(ok bool)`

### claim-milestone-bonus

Claim reward and mint achievement NFT.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `milestone-id` (uint): Milestone identifier

**Returns**: `(ok {bonus-amount: uint, nft-id: uint})`

**Errors**:
- `ERR_MILESTONE_NOT_ACHIEVED` (u8000)
- `ERR_BONUS_ALREADY_CLAIMED` (u8001)

---

## Budget Optimizer

### initialize-campaign-budget

Set up budget optimization.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `total-budget` (uint): Available budget
- `optimization-strategy` (uint): 1=equal, 2=performance, 3=ROI, 4=conversion

**Returns**: `(ok bool)`

### create-allocation

Allocate budget to channel.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `channel` (string-ascii 64): Channel name
- `amount` (uint): Allocation amount

**Returns**: `(ok uint)` - Allocation ID

### reallocate-budget

Move budget from underperforming to high-performing channel.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `from-allocation-id` (uint): Source allocation
- `to-allocation-id` (uint): Target allocation
- `amount` (uint): Amount to move
- `reason` (string-ascii 128): Reallocation reason

**Returns**: `(ok bool)`

**Errors**:
- `ERR_REALLOCATION_TOO_SOON` (u9000): 24h cooldown
- `ERR_POOR_PERFORMANCE` (u9001): Target ROI not better

---

## Campaign Analytics

### update-campaign-metrics

Update real-time campaign metrics.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `views` (uint): New views
- `clicks` (uint): New clicks
- `conversions` (uint): New conversions
- `revenue` (uint): New revenue
- `spend` (uint): New spend
- `unique-visitors` (uint): Unique visitor count
- `bounce-rate` (uint): Bounce rate (basis points)
- `avg-session-duration` (uint): Average session length

**Returns**: `(ok {ctr: uint, cvr: uint, roi: uint, roas: uint})`

### create-snapshot

Take time-series snapshot.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `period-type` (uint): 3600=hourly, 86400=daily, 604800=weekly, 2592000=monthly

**Returns**: `(ok uint)` - Snapshot ID

### calculate-growth-rate

Compare period-over-period metrics.

**Parameters**:
- `campaign-id` (uint): Campaign identifier
- `current-snapshot-id` (uint): Recent snapshot
- `previous-snapshot-id` (uint): Earlier snapshot
- `metric-type` (uint): 1=views, 2=clicks, 3=conversions, 4=revenue, 5=spend

**Returns**: `(ok uint)` - Growth rate in basis points

**Example**:
```clarity
(contract-call? .campaign-analytics-v4 calculate-growth-rate
  u1
  u10  ;; Current week snapshot
  u9   ;; Previous week snapshot
  u1   ;; Views metric
)
;; Returns: u2500 (25% growth)
```

---

## Common Data Types

### Campaign State
```clarity
u0 - STATE_DRAFT
u1 - STATE_FUNDED
u2 - STATE_ACTIVE
u3 - STATE_PAUSED
u4 - STATE_COMPLETED
u5 - STATE_CANCELLED
```

### Auction Type
```clarity
u1 - AUCTION_TYPE_DUTCH
u2 - AUCTION_TYPE_ENGLISH
u3 - AUCTION_TYPE_SEALED_BID
```

### Milestone Type
```clarity
u1 - MILESTONE_TYPE_VIEWS
u2 - MILESTONE_TYPE_CLICKS
u3 - MILESTONE_TYPE_CONVERSIONS
u4 - MILESTONE_TYPE_CTR
u5 - MILESTONE_TYPE_REVENUE
```

### Optimization Strategy
```clarity
u1 - STRATEGY_EQUAL
u2 - STRATEGY_PERFORMANCE_BASED
u3 - STRATEGY_ROI_WEIGHTED
u4 - STRATEGY_CONVERSION_FOCUSED
```

---

## Rate Limits & Constraints

- **Max Batch Size**: 50 recipients per payout batch
- **Max Approvers**: 10 per escrow
- **Max Extension**: 30 days per duration extension request
- **Reallocation Cooldown**: 24 hours between budget reallocations
- **Min ROI Threshold**: 50% (5000 basis points) for reallocation
- **Bid Bond**: 10% of bid amount required
- **Anti-snipe Extension**: 5 minutes on last-minute bids
- **Fraud Slash Rate**: 50% penalty for detected fraud
- **Poor Performance Slash**: 10% penalty for underperformance

---

## Error Codes Reference

| Range | Contract | Purpose |
|-------|----------|---------|
| 1000-1999 | campaign-lifecycle | State management |
| 2000-2999 | escrow-vault | Escrow operations |
| 3000-3999 | auction-engine | Bidding system |
| 4000-4999 | performance-oracle | Data verification |
| 5000-5999 | payout-automation | Payment processing |
| 6000-6999 | campaign-extension | Campaign modifications |
| 7000-7999 | refund-processor | Refund handling |
| 8000-8999 | milestone-tracker | Achievement tracking |
| 9000-9999 | budget-optimizer | Budget allocation |
| 10000-10999 | campaign-analytics-v4 | Analytics aggregation |
