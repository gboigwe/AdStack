# Dispute Resolution & Arbitration System

Complete on-chain dispute resolution infrastructure for the AdStack platform with tiered arbitration, evidence management, judgment execution, and appeal mechanisms.

## Architecture

The system consists of four interconnected smart contracts:

```
dispute-manager.clar          arbitrator-registry.clar
      |                              |
      |-- file/escalate/resolve      |-- register/assign/rate
      |                              |
      v                              v
evidence-vault.clar           judgment-executor.clar
      |                              |
      |-- submit/verify/seal         |-- issue/execute/appeal
```

### dispute-manager.clar

Core dispute lifecycle management with tiered severity and SLA enforcement.

**Error Codes:** u400-u413

| Function | Access | Description |
|----------|--------|-------------|
| `file-dispute` | Any user | File a new dispute against a respondent |
| `acknowledge-dispute` | Respondent | Acknowledge receipt of dispute |
| `move-to-investigation` | Owner | Transition to investigation phase |
| `escalate-to-arbitration` | Owner | Escalate to arbitration |
| `resolve-case` | Owner | Mark case as resolved |
| `dismiss-case` | Owner | Dismiss case with reason |
| `file-counter-claim` | Respondent | File a counter-claim |
| `accept-counter-claim` | Owner | Accept a counter-claim |
| `flag-sla-breach` | Owner | Flag SLA breach on a case |
| `update-severity` | Owner | Update case severity level |

**Severity Levels:**
- `u1` Low - General complaints (SLA: 1440 blocks)
- `u2` Medium - Payment issues (SLA: 720 blocks)
- `u3` High - Fraud allegations (SLA: 360 blocks)
- `u4` Critical - System-wide impact (SLA: 144 blocks)

**Status Flow:**
```
Filed -> Acknowledged -> Investigation -> Arbitration -> Resolved -> Closed
  |                                                         |
  +---> Dismissed                                     Appealed
```

### arbitrator-registry.clar

Arbitrator onboarding, reputation tracking, tiered case assignment, and rewards.

**Error Codes:** u500-u512

| Function | Access | Description |
|----------|--------|-------------|
| `register-arbitrator` | Any user | Register with specialization and stake |
| `assign-case` | Owner | Assign a case to an arbitrator |
| `accept-assignment` | Assigned arbitrator | Accept case assignment |
| `complete-case` | Owner | Mark arbitration as complete |
| `rate-arbitrator` | Any user | Rate arbitrator performance (1-10) |
| `claim-reward` | Arbitrator | Claim earned rewards |
| `suspend-arbitrator` | Owner | Suspend arbitrator |
| `slash-stake` | Owner | Slash arbitrator stake for misconduct |

**Tier System:**
| Tier | Label | Min Cases | Min Reputation |
|------|-------|-----------|----------------|
| 1 | Junior | 0 | 0 |
| 2 | Associate | 10 | 600 |
| 3 | Senior | 50 | 750 |
| 4 | Expert | 100 | 900 |

### evidence-vault.clar

Encrypted evidence storage with hash verification, IPFS integration, and access control.

**Error Codes:** u600-u611

| Function | Access | Description |
|----------|--------|-------------|
| `submit-evidence` | Any user | Submit evidence with content hash and IPFS CID |
| `verify-evidence` | Owner | Mark evidence as verified |
| `grant-access` | Submitter | Grant access to another party |
| `revoke-access` | Submitter | Revoke previously granted access |
| `seal-case-evidence` | Owner | Seal evidence (prevent new submissions) |
| `challenge-evidence` | Any user | Challenge evidence authenticity |
| `resolve-challenge` | Owner | Resolve an evidence challenge |
| `create-integrity-checkpoint` | Owner | Create tamper-proof checkpoint |

**Evidence Types:** Document (1), Screenshot (2), Communication (3), Transaction (4), Analytics (5), Witness (6)

**Access Levels:** Parties Only (1), Arbitrator (2), Public (3)

### judgment-executor.clar

Automated judgment execution with refunds, penalties, appeals, and settlement mechanisms.

**Error Codes:** u700-u711

| Function | Access | Description |
|----------|--------|-------------|
| `issue-judgment` | Owner | Issue judgment with awards and penalties |
| `execute-judgment` | Owner | Execute judgment (trigger payouts) |
| `finalize-judgment` | Owner | Finalize and close judgment |
| `file-appeal` | Any user | File appeal within appeal window |
| `decide-appeal` | Owner | Grant or deny appeal |
| `offer-settlement` | Any user | Propose settlement terms |
| `accept-settlement` | Counter-party | Accept settlement offer |
| `apply-penalty` | Owner | Apply penalty to party's ledger |

**Outcome Types:** Claimant Wins (1), Respondent Wins (2), Split Decision (3), Dismissed (4), Settlement (5)

**Penalty Levels:** None (0), Warning (1), Fine (2), Suspension (3), Ban (4)

## Frontend Components

11 React components in `frontend/src/components/disputes/`:

| Component | Description |
|-----------|-------------|
| `DisputeFilingForm` | Multi-step dispute filing with type/severity selection |
| `EvidenceUpload` | Evidence submission with IPFS CID and hash verification |
| `ArbitratorDashboard` | Tabbed dashboard with performance metrics and case list |
| `CaseViewer` | Full case detail display with timeline and SLA status |
| `VotingInterface` | Arbitrator outcome selection with reasoning input |
| `ResolutionTracker` | Step-by-step progress visualization |
| `AppealSystem` | Multi-round appeal filing with window countdown |
| `JudgmentHistory` | Expandable records with award details and appeal history |
| `ArbitratorSelection` | Filterable candidate list with tier/reputation sorting |
| `EvidenceTimeline` | Chronological evidence display with challenges |
| `NotificationSystem` | Type-filtered dispute event notifications |

## Hooks

| Hook | Description |
|------|-------------|
| `useDisputeCase(caseId)` | Fetch case data, metadata, and SLA status |
| `useArbitrator(address)` | Fetch arbitrator profile, performance, availability |
| `useCaseEvidence(caseId)` | Fetch all evidence items for a case |
| `useCaseJudgment(caseId)` | Fetch judgment, appeal eligibility, and appeals |

## Usage

```typescript
import {
  DisputeFilingForm,
  CaseViewer,
  ArbitratorDashboard,
  useDisputeCase,
  useCaseJudgment,
} from '@/components/disputes';

function DisputePage({ caseId }: { caseId: number }) {
  const { disputeCase, loading } = useDisputeCase(caseId);
  const { judgment, appeals } = useCaseJudgment(caseId);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <CaseViewer disputeCase={disputeCase} />
      {judgment && <JudgmentHistory records={[{ judgment, appeals }]} />}
    </div>
  );
}
```

## Testing

Run the test suite:

```bash
npx vitest run tests/dispute-manager_test.ts
npx vitest run tests/arbitrator-registry_test.ts
npx vitest run tests/evidence-judgment_test.ts
```

90 total tests covering:
- Dispute filing, lifecycle, counter-claims, SLA, severity
- Arbitrator registration, assignment, rating, slashing
- Evidence submission, verification, sealing, challenges
- Judgment issuance, execution, appeals, settlements, penalties
