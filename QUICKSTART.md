# Campaign Lifecycle Suite - Quick Start Guide

Get started with the Campaign Lifecycle Suite in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Stacks wallet (Hiro Wallet or Leather)
- Some testnet/mainnet STX for transactions

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd AdStack
npm install
```

### 2. Configure Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD
NEXT_PUBLIC_NETWORK=mainnet
```

### 3. Deploy Contracts (First Time Only)

```bash
# Check contract syntax
clarinet check

# Run tests
clarinet test

# Deploy to testnet/mainnet
clarinet deployments apply -p deployments/default.mainnet-plan.yaml
```

## Quick Start Example

### 1. Connect Wallet

```typescript
import { useWallet } from '@/store/wallet-store';

function MyComponent() {
  const { connect, address, isConnected } = useWallet();

  return (
    <button onClick={connect}>
      {isConnected ? address : 'Connect Wallet'}
    </button>
  );
}
```

### 2. Create Your First Campaign

```typescript
import { createCampaign } from '@/lib/contracts/campaign-lifecycle';
import { getStacksNetwork } from '@/lib/stacks-config';

const campaign = await createCampaign({
  name: "My First Campaign",
  budget: 10000000000n, // 10,000 STX
  fundingThreshold: 8000000000n, // 8,000 STX minimum
  startTime: Math.floor(Date.now() / 1000),
  endTime: Math.floor(Date.now() / 1000) + 2592000, // 30 days
  metadata: JSON.stringify({
    description: "Test campaign",
    targetAudience: "Crypto enthusiasts"
  }),
  network: getStacksNetwork(),
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
  onFinish: (data) => console.log('Campaign created!', data),
  onCancel: () => console.log('Cancelled')
});
```

### 3. Fund Your Campaign

```typescript
import { fundCampaign } from '@/lib/contracts/campaign-lifecycle';

await fundCampaign({
  campaignId: 1,
  amount: 9000000000n, // 9,000 STX (exceeds threshold, auto-activates)
  network: getStacksNetwork(),
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
  userAddress: address,
  onFinish: (data) => console.log('Campaign funded!', data)
});
```

### 4. Create Escrow for Publisher

```typescript
import { createEscrow } from '@/lib/contracts/escrow-vault';

await createEscrow({
  campaignId: 1,
  beneficiary: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
  amount: 5000000000n, // 5,000 STX
  timeLockDuration: 86400, // 24 hours
  performanceThreshold: 80, // 80%
  expiresIn: 2592000, // 30 days
  requiredApprovers: ['SP...1', 'SP...2'],
  network: getStacksNetwork(),
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
  userAddress: address,
  onFinish: (data) => console.log('Escrow created!', data)
});
```

### 5. Set Up Milestones

```typescript
import { createMilestone } from '@/lib/contracts/milestone-tracker';

await createMilestone({
  campaignId: 1,
  milestoneType: 2, // Clicks
  targetValue: 5000, // 5,000 clicks
  bonusAmount: 1000000000n, // 1,000 STX bonus
  description: "Reach 5k clicks",
  network: getStacksNetwork(),
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
  onFinish: (data) => console.log('Milestone created!', data)
});
```

### 6. Process Payouts

```typescript
import { createPayoutBatch, executePayoutBatch } from '@/lib/contracts/payout-automation';

// Create batch
const batchResult = await createPayoutBatch({
  campaignId: 1,
  recipients: [
    { recipient: 'SP...1', amount: 500000000n },
    { recipient: 'SP...2', amount: 750000000n }
  ],
  network: getStacksNetwork(),
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!
});

// Execute batch
await executePayoutBatch({
  batchId: batchResult.value,
  network: getStacksNetwork(),
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
  onFinish: (data) => console.log('Payouts processed!', data)
});
```

## Using the UI Components

### Campaign Wizard

```typescript
import CampaignWizard from '@/components/campaign/CampaignWizard';

function CreateCampaignPage() {
  return <CampaignWizard />;
}
```

### Campaign Dashboard

```typescript
import CampaignDashboard from '@/components/campaign/CampaignDashboard';

function DashboardPage() {
  return <CampaignDashboard />;
}
```

### Escrow Monitor

```typescript
import EscrowMonitor from '@/components/escrow/EscrowMonitor';

function EscrowPage() {
  return <EscrowMonitor campaignId={1} />;
}
```

### Payout History

```typescript
import PayoutHistory from '@/components/payout/PayoutHistory';

function PayoutsPage() {
  return <PayoutHistory campaignId={1} />;
}
```

## Complete Workflow Example

See `examples/campaign-workflow.ts` for a complete end-to-end workflow including:

1. Campaign creation
2. Funding
3. Escrow setup
4. Milestone configuration
5. Performance tracking
6. Bonus claims
7. Escrow releases
8. Batch payouts

Run it:

```typescript
import { runCompleteWorkflow } from './examples/campaign-workflow';

runCompleteWorkflow()
  .then(() => console.log('Workflow complete!'))
  .catch(console.error);
```

## Testing

### Run Contract Tests

```bash
clarinet test
```

### Run Integration Tests

```bash
npm test
```

### Manual Testing on Testnet

1. Switch to testnet in `.env.local`:
   ```
   NEXT_PUBLIC_NETWORK=testnet
   ```

2. Get testnet STX from faucet:
   ```
   https://explorer.hiro.so/sandbox/faucet?chain=testnet
   ```

3. Deploy contracts to testnet:
   ```bash
   clarinet deployments apply -p deployments/default.testnet-plan.yaml
   ```

4. Test in browser:
   ```bash
   npm run dev
   ```

## Common Issues

### Issue: Transaction failing with "Unauthorized"
**Solution**: Ensure you're connected with the wallet that deployed the contracts (contract owner).

### Issue: "Insufficient funds" error
**Solution**: Check wallet balance. Ensure you have enough STX for both the transaction amount and gas fees.

### Issue: "Invalid state transition"
**Solution**: Campaigns must follow state flow: Draft → Funded → Active → Paused/Completed/Cancelled. Check current state before attempting transition.

### Issue: Escrow release failing
**Solution**: Verify:
- Time-lock has passed
- All required approvals received
- Escrow hasn't expired
- Performance threshold met

## Next Steps

1. **Read Full Documentation**: See `docs/CAMPAIGN_LIFECYCLE_SUITE.md`
2. **API Reference**: Check `docs/API_REFERENCE.md`
3. **Customize Components**: Modify UI components to match your brand
4. **Add Analytics**: Integrate campaign-analytics-v4 for insights
5. **Optimize Budgets**: Use budget-optimizer for ROI improvement

## Support

- **Documentation**: `/docs`
- **Examples**: `/examples`
- **GitHub Issues**: [Create issue](https://github.com/yourusername/AdStack/issues)
- **Discord**: Join our community at https://discord.gg/adstack

## Security Notes

⚠️ **Important Security Considerations**:

1. **Test First**: Always test on testnet before mainnet deployment
2. **Post-Conditions**: Frontend includes STX transfer post-conditions for safety
3. **Authorization**: Contract owner has special privileges - secure your private key
4. **Escrow Approvers**: Choose trusted approvers for escrow releases
5. **Audit**: Consider professional audit before handling large amounts

## License

MIT License - See LICENSE file for details

---

Built with ❤️ using Stacks blockchain and Clarity smart contracts
