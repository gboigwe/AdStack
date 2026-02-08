# Bridge UI Components

React components for the AdStack Cross-Chain Bridge interface.

## Components

### BridgeInterface
Main bridge transfer interface for cross-chain token transfers.

**Features:**
- Chain selection (Ethereum, Polygon, BSC, Avalanche, Stacks)
- Token selection with balance display
- Amount input with slippage protection
- Transaction summary with fees
- Real-time status updates

**Usage:**
```tsx
import { BridgeInterface } from '@/components/bridge';

function BridgePage() {
  return <BridgeInterface />;
}
```

### TransactionHistory
Track and monitor bridge transactions.

**Features:**
- Transaction status tracking
- Search and filter capabilities
- Validator signature progress
- Export to CSV
- Real-time updates

**Usage:**
```tsx
import { TransactionHistory } from '@/components/bridge';

function HistoryPage() {
  return <TransactionHistory />;
}
```

### TokenSelector
Token selection dialog with multi-chain support.

**Features:**
- Search by token name or symbol
- Filter by favorites
- Chain-specific filtering
- Real-time price updates
- Portfolio value tracking

**Props:**
```tsx
interface TokenSelectorProps {
  onSelectToken?: (token: Token) => void;
  selectedToken?: string;
  filterByChain?: string;
}
```

**Usage:**
```tsx
import { TokenSelector } from '@/components/bridge';

function MyComponent() {
  const [token, setToken] = useState('USDC');

  return (
    <TokenSelector
      selectedToken={token}
      onSelectToken={(t) => setToken(t.symbol)}
      filterByChain="Ethereum"
    />
  );
}
```

### BalanceViewer
Multi-chain balance dashboard.

**Features:**
- View balances across all chains
- Locked vs available balance breakdown
- Balance distribution visualization
- Hide/show balances
- Refresh functionality

**Usage:**
```tsx
import { BalanceViewer } from '@/components/bridge';

function WalletPage() {
  return <BalanceViewer />;
}
```

### PaymentDashboard
Multi-token payment processing interface.

**Features:**
- Pay with any whitelisted token
- Escrow account management
- Payment history tracking
- Real-time fee calculation
- Auto-conversion to STX

**Usage:**
```tsx
import { PaymentDashboard } from '@/components/bridge';

function PaymentsPage() {
  return <PaymentDashboard />;
}
```

### BridgeAnalytics
Analytics dashboard for bridge metrics.

**Features:**
- Cross-chain volume tracking
- Transaction statistics
- Token supply metrics
- Validator performance
- TVL (Total Value Locked) tracking

**Usage:**
```tsx
import { BridgeAnalytics } from '@/components/bridge';

function AnalyticsPage() {
  return <BridgeAnalytics />;
}
```

### ValidatorMonitor
Validator network monitoring dashboard.

**Features:**
- Real-time validator status
- Uptime tracking
- Signature count
- Network health metrics
- Performance alerts

**Usage:**
```tsx
import { ValidatorMonitor } from '@/components/bridge';

function ValidatorsPage() {
  return <ValidatorMonitor />;
}
```

## Installation

All components are already included in the project. Import them from the bridge components directory:

```tsx
import {
  BridgeInterface,
  TransactionHistory,
  TokenSelector,
  BalanceViewer,
  PaymentDashboard,
  BridgeAnalytics,
  ValidatorMonitor
} from '@/components/bridge';
```

## Dependencies

These components rely on:
- `@/components/ui/*` - shadcn/ui components
- `lucide-react` - Icons
- `react` - React framework

Ensure all dependencies are installed:
```bash
npm install lucide-react
```

## Styling

Components use Tailwind CSS for styling and follow the shadcn/ui design system. Make sure your `tailwind.config.js` is properly configured.

## Integration with Stacks

For actual blockchain integration, use the Stacks.js SDK:

```tsx
import { useConnect } from '@stacks/connect-react';
import { BridgeInterface } from '@/components/bridge';

function BridgePage() {
  const { doContractCall } = useConnect();

  const handleBridge = async (params) => {
    await doContractCall({
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'token-bridge',
      functionName: 'lock-tokens',
      functionArgs: [...],
    });
  };

  return <BridgeInterface onBridge={handleBridge} />;
}
```

See [INTEGRATION_EXAMPLES.md](../../../docs/INTEGRATION_EXAMPLES.md) for detailed integration examples.

## Mock Data

Currently, components use mock data for demonstration. In production:

1. Replace mock data with API calls to relayer service
2. Connect to blockchain for real-time data
3. Implement WebSocket for live updates

## Testing

Test components with:
```bash
npm run test
```

## Contributing

When adding new bridge components:
1. Follow existing component patterns
2. Use TypeScript for type safety
3. Include proper JSDoc comments
4. Export from `index.ts`
5. Update this README

## License

MIT
