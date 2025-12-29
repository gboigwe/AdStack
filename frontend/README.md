# AdStack Frontend

A decentralized advertising platform built on Stacks blockchain with **Stacks.js v7+** and **Clarity v4**.

## Features

- **Stacks.js v7+ Integration**: Full support for latest Stacks SDK
- **Clarity v4 Contracts**: Leveraging `stacks-block-time` for Unix timestamps
- **Type-Safe**: Complete TypeScript definitions for all contract interactions
- **React Query**: Automatic caching and state management
- **Wallet Integration**: Seamless Stacks wallet connection
- **Error Handling**: User-friendly error messages
- **Post-Conditions**: Transaction safety guarantees

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Blockchain**: Stacks.js v7+
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Language**: TypeScript 5+

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Stacks wallet (Leather, Xverse, etc.)

### Installation

```bash
# Install dependencies
npm install
# or
bun install
```

### Development

```bash
# Run development server
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build

```bash
# Production build
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── hooks/           # Custom React hooks (useContract, etc.)
├── lib/             # Core utilities
│   ├── stacks-config.ts        # Network configuration
│   ├── transaction-builder.ts  # Contract calls
│   ├── read-only-calls.ts     # Read-only queries
│   ├── error-handler.ts       # Error parsing
│   ├── response-parsers.ts    # Clarity response parsing
│   ├── post-conditions.ts     # Transaction safety
│   ├── clarity-converters.ts  # Type conversions
│   ├── display-utils.ts       # Formatting helpers
│   └── wallet.ts              # Wallet integration
├── store/           # Zustand state stores
└── types/           # TypeScript definitions
    ├── clarity-v4.ts   # Clarity type definitions
    └── contracts.ts    # Contract interfaces
```

## Stacks.js v7+ Migration

This project uses **Stacks.js v7+** with full **Clarity v4** support. See [STACKS_V7_MIGRATION.md](./STACKS_V7_MIGRATION.md) for:

- Migration guide from v6 to v7
- Clarity v4 features (`stacks-block-time`, etc.)
- Type-safe contract interactions
- Transaction patterns
- Error handling
- React hooks usage

### Key Changes from v6

```typescript
// OLD (v6)
import { StacksMainnet } from '@stacks/network';
const network = new StacksMainnet();

// NEW (v7+)
import { STACKS_MAINNET } from '@stacks/network';
const network = STACKS_MAINNET;
```

## Contract Interaction

### Reading Contract Data

```typescript
import { useCampaign } from '@/hooks/useContract';

function CampaignView({ campaignId }: { campaignId: number }) {
  const { data, isLoading, error } = useCampaign(campaignId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data?.data?.name}</div>;
}
```

### Writing to Contracts

```typescript
import { useCreateCampaign } from '@/hooks/useContract';

function CreateCampaign() {
  const { createCampaign, isPending } = useCreateCampaign();

  const handleCreate = () => {
    createCampaign({
      name: 'My Campaign',
      budget: 1000000n, // 1 STX in micro-STX
      dailyBudget: 100000n,
      duration: 30,
    });
  };

  return <button onClick={handleCreate}>Create Campaign</button>;
}
```

## Environment Variables

Create a `.env.local` file:

```bash
# Network (mainnet, testnet, devnet)
NEXT_PUBLIC_NETWORK=testnet

# Contract deployer address
NEXT_PUBLIC_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
```

## Resources

- [Stacks.js v7 Docs](https://docs.hiro.so/stacks.js)
- [Clarity v4 Reference](https://docs.stacks.co/clarity)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query)

## License

MIT
