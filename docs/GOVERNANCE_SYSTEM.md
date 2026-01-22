# AdStack Governance & DAO System

Complete documentation for the AdStack decentralized governance system.

## Overview

The AdStack Governance System provides a complete on-chain DAO implementation with proposal creation, voting, delegation, multi-signature treasury management, and timelock execution. This system enables the AdStack community to govern the protocol through transparent, on-chain decision-making.

## System Architecture

The governance system consists of four interconnected smart contracts:

1. **governance-core.clar** - Proposal creation, voting, and execution logic
2. **governance-token.clar** - SIP-010 compliant token with voting power
3. **multisig-treasury.clar** - Multi-signature treasury management
4. **timelock-executor.clar** - Delayed execution security mechanism

## Smart Contracts

### governance-core.clar

The core governance contract manages the full proposal lifecycle.

#### Key Features

- Proposal creation with minimum token threshold (100,000 ADSGOV)
- On-chain voting with three options: For, Against, Abstain
- Quorum requirement (40% of total voting power)
- Automatic proposal state transitions
- Execution queue with time delays
- Proposal cancellation for authorized users

#### Governance Parameters

```clarity
proposal-threshold: 100,000 tokens (100k ADSGOV)
quorum-percentage: 40%
voting-period: 4,320 blocks (~30 days)
execution-delay: 1,440 blocks (~10 days)
```

#### Proposal States

- **PENDING (0)** - Proposal created, not yet active
- **ACTIVE (1)** - Voting period is open
- **SUCCEEDED (2)** - Proposal passed, awaiting execution
- **DEFEATED (3)** - Proposal failed to reach quorum or majority
- **EXECUTED (4)** - Proposal successfully executed
- **CANCELLED (5)** - Proposal was cancelled

#### Main Functions

**create-proposal**
```clarity
(create-proposal
  (title (string-utf8 256))
  (description (string-utf8 2048))
  (contract-call-data (optional {...}))
)
```
Creates a new proposal. Requires minimum token threshold.

**cast-vote**
```clarity
(cast-vote (proposal-id uint) (support uint))
```
Cast a vote on an active proposal. Support: 0=Against, 1=For, 2=Abstain.

**queue-proposal**
```clarity
(queue-proposal (proposal-id uint))
```
Queue a successful proposal for execution after checking quorum.

**execute-proposal**
```clarity
(execute-proposal (proposal-id uint))
```
Execute a queued proposal after execution delay expires.

### governance-token.clar

SIP-010 compliant governance token with voting power delegation.

#### Token Details

- **Name:** AdStack Governance
- **Symbol:** ADSGOV
- **Decimals:** 6
- **Max Supply:** 1,000,000 tokens (1M ADSGOV)

#### Key Features

- Full SIP-010 standard compliance
- Voting power delegation system
- Automatic delegation tracking
- Vote power snapshot capability

#### Main Functions

**delegate**
```clarity
(delegate (delegate-to principal))
```
Delegate voting power to another address.

**revoke-delegation**
```clarity
(revoke-delegation)
```
Revoke current delegation and reclaim voting power.

**get-voting-power**
```clarity
(get-voting-power (voter principal))
```
Returns effective voting power (0 if delegated, balance otherwise).

### multisig-treasury.clar

Multi-signature treasury for secure fund management.

#### Configuration

- **Default Signers:** 5
- **Default Threshold:** 3 signatures required
- **Configurable:** Admin can adjust signers and threshold

#### Key Features

- Multi-signature transaction approval
- Configurable signature thresholds
- Transaction proposal system
- Emergency pause mechanism
- Signer management

#### Main Functions

**propose-transaction**
```clarity
(propose-transaction
  (recipient principal)
  (amount uint)
  (memo (string-utf8 256))
)
```
Propose a new treasury transaction (auto-signs from proposer).

**sign-transaction**
```clarity
(sign-transaction (tx-id uint))
```
Add signature to a proposed transaction.

**execute-transaction**
```clarity
(execute-transaction (tx-id uint))
```
Execute transaction after threshold is met.

### timelock-executor.clar

Provides security through delayed execution of governance actions.

#### Timelock Parameters

```clarity
min-delay: 1,440 blocks (~10 days)
max-delay: 8,640 blocks (~60 days)
grace-period: 2,880 blocks (~20 days)
```

#### Key Features

- Configurable execution delays
- Operation queueing system
- Cancellation capability
- Grace period for execution window
- Role-based access (admins, proposers)

#### Main Functions

**queue-operation**
```clarity
(queue-operation
  (target-contract principal)
  (function-name (string-ascii 128))
  (params-hash (buff 32))
  (value uint)
  (delay uint)
  (description (string-utf8 512))
)
```
Queue an operation for delayed execution.

**execute-operation**
```clarity
(execute-operation (operation-id uint))
```
Execute operation after delay expires.

**cancel-operation**
```clarity
(cancel-operation (operation-id uint))
```
Cancel a queued operation (admin or proposer only).

## Frontend Components

### GovernanceDashboard

Main dashboard displaying governance statistics and active proposals.

**Features:**
- Total proposals count
- Active proposals tracking
- Voting power display
- Participation metrics
- Proposal listing with states

### ProposalWizard

Form for creating new governance proposals.

**Features:**
- Title and description inputs (character limits enforced)
- Optional contract execution details
- Form validation
- Proposal requirement information

### VotingInterface

Interactive component for voting on proposals.

**Features:**
- Live vote tallies with percentages
- Visual progress bars
- Three voting options (For, Against, Abstain)
- Vote submission with confirmation
- Historical vote display

### TreasuryViewer

Multi-signature treasury management interface.

**Features:**
- Treasury balance display
- Pending transactions list
- Signature status tracking
- Transaction execution controls
- Multi-sig information

### DelegationManager

Interface for delegating voting power.

**Features:**
- Current delegation status
- Delegation form with address validation
- Revocation capability
- Voting power statistics
- Delegation information

### ProposalTimeline

Visual timeline of proposal lifecycle events.

**Features:**
- Chronological event display
- State transition tracking
- Block height information
- Execution delay visualization
- Progress indicators

### MultiSigBuilder

Form for proposing treasury transactions.

**Features:**
- Recipient address input
- Amount specification (STX)
- Transaction memo
- Form validation
- Multi-sig process information

## Integration Guide

### 1. Install Dependencies

```bash
npm install @stacks/transactions @stacks/connect
```

### 2. Import Utilities

```typescript
import {
  createProposal,
  castVote,
  delegateVotingPower,
} from '@/lib/governance/contracts';
```

### 3. Use Components

```typescript
import { GovernanceDashboard } from '@/components/governance/GovernanceDashboard';
import { ProposalWizard } from '@/components/governance/ProposalWizard';
import { VotingInterface } from '@/components/governance/VotingInterface';
```

### 4. Create Proposal Example

```typescript
const result = await createProposal(
  contractAddress,
  'Update Quorum Threshold',
  'Proposal to increase quorum from 40% to 50%',
  targetContract,
  'set-quorum-percentage',
  50
);
```

### 5. Vote Example

```typescript
import { VOTE_SUPPORT } from '@/lib/governance/contracts';

await castVote(contractAddress, proposalId, VOTE_SUPPORT.FOR);
```

## Security Considerations

### Timelock Protection

All governance actions go through a mandatory execution delay (~10 days) providing time for the community to review and react to passed proposals.

### Multi-Signature Treasury

The treasury requires 3 of 5 signatures for any transaction, preventing unilateral fund movements.

### Delegation Safety

- Token holders retain ownership when delegating
- Delegation can be revoked at any time
- Delegated power doesn't transfer tokens

### Quorum Requirements

40% participation requirement ensures proposals have broad community support before execution.

## Common Workflows

### Creating and Passing a Proposal

1. User creates proposal (requires 100k ADSGOV)
2. Proposal enters 30-day voting period
3. Community votes (For/Against/Abstain)
4. If quorum met and majority vote FOR:
   - Proposal state → SUCCEEDED
   - 10-day execution delay begins
5. After delay, proposal can be executed
6. Proposal state → EXECUTED

### Treasury Transaction

1. Signer proposes transaction (auto-signed)
2. Other signers review and sign
3. After 3/5 signatures collected
4. Anyone can execute the transaction
5. Funds transferred to recipient

### Delegating Voting Power

1. Token holder calls `delegate(delegatee-address)`
2. Voting power transferred to delegatee
3. Delegation recorded on-chain
4. Can revoke at any time to reclaim power

## Error Codes

### governance-core.clar
- `u9000` - Unauthorized
- `u9001` - Proposal not found
- `u9002` - Already voted
- `u9003` - Voting period closed
- `u9004` - Quorum not met
- `u9005` - Proposal failed
- `u9006` - Invalid parameters
- `u9007` - Already executed

### governance-token.clar
- `u11000` - Unauthorized
- `u11001` - Insufficient balance
- `u11002` - Invalid parameters

### multisig-treasury.clar
- `u10000` - Unauthorized
- `u10001` - Transaction not found
- `u10002` - Already signed
- `u10003` - Insufficient signatures
- `u10004` - Already executed
- `u10005` - Invalid threshold
- `u10006` - Contract paused

### timelock-executor.clar
- `u12000` - Unauthorized
- `u12001` - Operation not found
- `u12002` - Operation already queued
- `u12003` - Operation not ready
- `u12004` - Operation expired
- `u12005` - Operation already executed
- `u12006` - Invalid parameters
- `u12007` - Execution failed

## Testing

### Unit Tests

Run governance contract tests:

```bash
npm test tests/governance-core.test.ts
npm test tests/governance-token.test.ts
npm test tests/multisig-treasury.test.ts
npm test tests/timelock-executor.test.ts
```

### Integration Testing

Test complete governance workflow:

```bash
npm test tests/governance-integration.test.ts
```

## Deployment

Deploy governance contracts:

```bash
clarinet deployments apply -p mainnet
```

Contracts will be deployed in this order:
1. governance-token
2. governance-core
3. multisig-treasury
4. timelock-executor

## Maintenance

### Parameter Updates

Governance parameters can be updated through governance proposals:

- Proposal threshold
- Quorum percentage
- Voting period duration
- Execution delay
- Treasury signature threshold

### Emergency Actions

Admin functions for emergency situations:

- Pause treasury transactions
- Emergency proposal cancellation
- Emergency operation execution (timelock bypass)

## Support

For questions or issues:
- GitHub Issues: https://github.com/gboigwe/AdStack/issues
- Documentation: /docs/GOVERNANCE_SYSTEM.md

## License

MIT License - See LICENSE file for details
