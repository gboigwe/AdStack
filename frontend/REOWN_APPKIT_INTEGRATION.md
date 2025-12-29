# Reown AppKit Integration Guide

Complete guide for integrating Reown AppKit (formerly WalletConnect) with Stacks blockchain in AdStack.

## Overview

This integration provides:
- **Multi-Wallet Support**: Leather, Xverse, Hiro, BOOM, OKX wallets
- **Mobile-First UX**: Responsive design with mobile wallet deep linking
- **Session Persistence**: Auto-reconnect on page reload
- **Transaction History**: View all wallet transactions
- **Token & NFT Display**: Portfolio viewer with balance tracking
- **Network Switching**: Seamless mainnet/testnet toggling
- **Analytics**: Track wallet connections and user behavior

## Architecture

```
src/
├── contexts/
│   └── AppKitProvider.tsx       # Main AppKit context provider
├── components/wallet/
│   ├── WalletModal.tsx           # Multi-wallet connection modal
│   ├── AccountSwitcher.tsx       # Account & network switcher
│   ├── TransactionHistory.tsx    # Transaction viewer
│   ├── WalletBalance.tsx         # Balance & token display
│   └── NFTGallery.tsx            # NFT collection viewer
├── lib/
│   ├── appkit-config.ts          # AppKit configuration
│   ├── wallet-session.ts         # Session management
│   └── wallet-analytics.ts       # Analytics tracking
└── store/
    └── wallet-store.ts           # Zustand state management
```

## Setup

### 1. Install Dependencies

```bash
npm install @reown/appkit @reown/appkit-universal-connector @stacks/connect
```

### 2. Get WalletConnect Project ID

1. Visit [Reown Cloud](https://cloud.reown.com/)
2. Create a new project
3. Copy your Project ID
4. Add to `.env.local`:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Wrap App with Providers

In `src/app/layout.tsx`:

```typescript
import { Providers } from '@/components/providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

## Usage

### Basic Wallet Connection

```typescript
import { WalletConnectButton } from '@/components/wallet/WalletModal';
import { AccountSwitcher } from '@/components/wallet/AccountSwitcher';
import { useWalletStore } from '@/store/wallet-store';

function MyComponent() {
  const { isConnected, address } = useWalletStore();

  return (
    <div>
      {isConnected ? (
        <AccountSwitcher />
      ) : (
        <WalletConnectButton />
      )}
    </div>
  );
}
```

### Transaction Tracking

```typescript
import { trackTransactionInitiated, trackTransactionSuccess } from '@/lib/wallet-analytics';
import { callContract } from '@/lib/transaction-builder';

async function createCampaign() {
  try {
    trackTransactionInitiated('create-campaign');

    const result = await callContract({
      contractName: 'promo-manager',
      functionName: 'create-campaign',
      functionArgs: [
        { type: 'string-ascii', value: 'My Campaign' },
        { type: 'uint', value: 1000000n },
      ],
    });

    if (result.success) {
      trackTransactionSuccess(result.txId, 'create-campaign');
    }
  } catch (error) {
    console.error('Transaction failed:', error);
  }
}
```

### Session Management

```typescript
import { saveWalletSession, loadWalletSession } from '@/lib/wallet-session';

// Save session after connection
function handleConnect(address: string, walletId: string) {
  saveWalletSession({
    address,
    walletId,
    network: 'testnet',
    connectedAt: Date.now(),
    lastActiveAt: Date.now(),
  });
}

// Load session on app start
function initializeApp() {
  const session = loadWalletSession();
  if (session) {
    console.log('Restoring session for:', session.address);
  }
}
```

### Display Components

#### Wallet Balance

```typescript
import { WalletBalance } from '@/components/wallet/WalletBalance';

function Dashboard() {
  return (
    <div>
      <WalletBalance showTokens={true} />
    </div>
  );
}
```

#### Transaction History

```typescript
import { TransactionHistory } from '@/components/wallet/TransactionHistory';

function AccountPage() {
  return (
    <div>
      <TransactionHistory />
    </div>
  );
}
```

#### NFT Gallery

```typescript
import { NFTGallery } from '@/components/wallet/NFTGallery';

function CollectionPage() {
  return (
    <div>
      <NFTGallery />
    </div>
  );
}
```

## Supported Wallets

| Wallet | Desktop | Mobile | Deep Link |
|--------|---------|--------|-----------|
| **Leather** | ✅ | ✅ | `leather://` |
| **Xverse** | ✅ | ✅ | `xverse://` |
| **Hiro** | ✅ | ❌ | `hiro://` |
| **BOOM** | ❌ | ✅ | `boom://` |
| **OKX** | ✅ | ✅ | `okx://` |

## Configuration

### AppKit Metadata

Customize your app's appearance in wallet modals:

```typescript
// src/lib/appkit-config.ts
export const APPKIT_METADATA = {
  name: 'AdStack',
  description: 'Decentralized Advertising Platform',
  url: 'https://adstack.app',
  icons: ['https://adstack.app/logo.png'],
};
```

### Theme Customization

```typescript
export const APPKIT_THEME = {
  themeMode: 'auto', // 'light' | 'dark' | 'auto'
  themeVariables: {
    '--w3m-accent': '#5546FF', // Stacks purple
    '--w3m-border-radius-master': '8px',
    '--w3m-font-family': 'Inter, sans-serif',
  },
};
```

### Network Configuration

```typescript
export const STACKS_CHAIN_CONFIG = {
  mainnet: {
    id: 'stacks:1',
    name: 'Stacks',
    rpcUrls: {
      default: { http: ['https://api.hiro.so'] },
    },
  },
  testnet: {
    id: 'stacks:2147483648',
    name: 'Stacks Testnet',
    rpcUrls: {
      default: { http: ['https://api.testnet.hiro.so'] },
    },
  },
};
```

## Analytics Integration

### Tracked Events

- `wallet_connected` - User connects wallet
- `wallet_disconnected` - User disconnects wallet
- `wallet_switched` - User switches to different wallet
- `network_switched` - User changes network
- `transaction_initiated` - Transaction starts
- `transaction_success` - Transaction completes
- `transaction_failed` - Transaction fails
- `wallet_modal_opened` - Modal opens
- `wallet_modal_closed` - Modal closes
- `session_started` - Session begins
- `session_expired` - Session ends

### Analytics Providers

Supports integration with:
- **Google Analytics 4**
- **Mixpanel**
- **Segment**
- **PostHog**

Example setup in `.env.local`:

```bash
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Mobile Responsiveness

### Features

✅ Touch-optimized wallet modal
✅ Mobile wallet deep linking
✅ Responsive transaction history
✅ Mobile-friendly NFT gallery
✅ Collapsible mobile menu
✅ Swipe gestures support

### Testing

Test on various devices:

```bash
# Desktop
http://localhost:3000

# Mobile simulation (Chrome DevTools)
# 1. Open DevTools (F12)
# 2. Toggle device toolbar (Ctrl+Shift+M)
# 3. Select mobile device
```

## Best Practices

### 1. Always Check Connection

```typescript
const { isConnected, address } = useWalletStore();

if (!isConnected || !address) {
  return <WalletConnectButton />;
}
```

### 2. Handle Errors Gracefully

```typescript
try {
  await connectWallet();
} catch (error: any) {
  if (error.code === 'USER_REJECTED') {
    // User cancelled - don't show error
    return;
  }
  toast.error(error.message);
}
```

### 3. Update Session Activity

```typescript
import { updateSessionActivity } from '@/lib/wallet-session';

// Call periodically (e.g., on user interaction)
updateSessionActivity();
```

### 4. Track Important Events

```typescript
import { trackWalletConnected, trackTransactionSuccess } from '@/lib/wallet-analytics';

// After successful connection
trackWalletConnected(walletId, address);

// After successful transaction
trackTransactionSuccess(txId, 'create-campaign');
```

## Troubleshooting

### Issue: Wallet not connecting

**Solution**: Check browser extension is installed and enabled

```javascript
// Check if wallet is installed
const isLeatherInstalled = !!(window as any).LeatherProvider;
const isXverseInstalled = !!(window as any).XverseProviders;
```

### Issue: Session not persisting

**Solution**: Verify localStorage is accessible

```javascript
// Test localStorage
try {
  localStorage.setItem('test', 'value');
  localStorage.removeItem('test');
} catch (e) {
  console.error('localStorage not available');
}
```

### Issue: Analytics not working

**Solution**: Enable analytics in environment variables

```bash
# .env.local
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

## Security Considerations

### 1. Never Store Private Keys

❌ Don't store private keys or seed phrases
✅ Only store public addresses and session data

### 2. Validate All Inputs

```typescript
// Always validate user inputs
const amount = BigInt(userInput);
if (amount <= 0n) {
  throw new Error('Invalid amount');
}
```

### 3. Use Post-Conditions

```typescript
import { createUserSTXPostCondition } from '@/lib/post-conditions';

const postConditions = [
  createUserSTXPostCondition(address, amount),
];
```

### 4. Verify Transaction Results

```typescript
if (!result.success || !result.txId) {
  throw new Error('Transaction failed');
}
```

## Resources

- [Reown AppKit Docs](https://docs.reown.com/appkit)
- [Stacks.js v7 Docs](https://docs.hiro.so/stacks.js)
- [Stacks Wallets](https://www.stacks.co/explore/wallets)
- [WalletConnect Cloud](https://cloud.reown.com/)

## Support

For issues or questions:
- Check [GitHub Issues](https://github.com/gboigwe/AdStack/issues)
- Review [Stacks Discord](https://discord.gg/stacks)
- Contact support@adstack.app
