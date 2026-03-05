# Stacks.js v7+ Migration Guide

This document outlines the migration to Stacks.js v7+ with full Clarity v4 support.

## Overview

We've upgraded from Stacks.js v6.x to v7+, enabling:
- Full Clarity v4 feature support
- `stacks-block-time` (Unix timestamps)
- Improved type safety
- Better error handling
- Modern transaction patterns

## Key Changes

### 1. Network Configuration

**Before (v6):**
```typescript
import { StacksMainnet, StacksTestnet } from '@stacks/network';

const network = new StacksMainnet();
```

**After (v7+):**
```typescript
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

const network = STACKS_MAINNET;
```

### 2. Clarity v4 Time Handling

**stacks-block-time** returns Unix timestamps (seconds), not block heights:

```typescript
// OLD: Block-based time (blocks)
const createdAt = blockHeight;

// NEW: Unix timestamp (seconds)
const createdAt = stacksBlockTime; // 1704067200 (seconds since epoch)

// Convert to JavaScript Date
const date = new Date(stacksBlockTime * 1000);
```

### 3. Type Converters

Use our custom converters for Clarity v4:

```typescript
import {
  toUIntCV,
  toStringAsciiCV,
  toPrincipalCV,
  stacksBlockTimeToDate,
} from '@/lib/clarity-converters';

// Create Clarity values
const amount = toUIntCV(1000000); // 1 STX in micro-STX
const name = toStringAsciiCV('My Campaign');
const owner = toPrincipalCV('SP2...');

// Parse stacks-block-time
const createdDate = stacksBlockTimeToDate(campaign.createdAt);
```

### 4. Transaction Building

Use simplified transaction builder:

```typescript
import { callContract } from '@/lib/transaction-builder';
import { createUserSTXPostCondition } from '@/lib/post-conditions';

const result = await callContract({
  contractName: 'promo-manager',
  functionName: 'create-campaign',
  functionArgs: [
    toStringAsciiCV('Campaign Name'),
    toUIntCV(1000000n), // 1 STX budget
    toUIntCV(100000n),  // 0.1 STX daily
    toUIntCV(30),       // 30 days
  ],
  postConditions: [
    createUserSTXPostCondition(userAddress, 1000000n),
  ],
});

if (result.success) {
  console.log('Transaction ID:', result.txId);
}
```

### 5. Read-Only Calls

Use typed read-only utilities:

```typescript
import { callReadOnly } from '@/lib/read-only-calls';

const campaign = await callReadOnly({
  contractName: 'promo-manager',
  functionName: 'get-campaign-details',
  functionArgs: [toUIntCV(1)],
});

if (campaign.success) {
  console.log('Campaign:', campaign.data);
}
```

### 6. React Hooks

Use React Query hooks for automatic caching and refetching:

```typescript
import { useCampaign, useCreateCampaign } from '@/hooks/useContract';

function CampaignView({ campaignId }: { campaignId: number }) {
  const { data, isLoading, error } = useCampaign(campaignId);
  const { createCampaign, isPending } = useCreateCampaign();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{data?.data?.name}</h1>
      <p>Budget: {microStxToStx(data?.data?.budget || 0n)} STX</p>
    </div>
  );
}
```

### 7. Error Handling

All errors are parsed to user-friendly messages:

```typescript
import { parseStacksError, getErrorMessage } from '@/lib/error-handler';

try {
  await callContract({ ... });
} catch (error) {
  const parsedError = parseStacksError(error);

  // Show to user
  toast.error(parsedError.message);

  // Log for debugging
  console.error(parsedError.code, parsedError.details);
}
```

### 8. Post-Conditions

Enforce transaction safety with post-conditions:

```typescript
import {
  createUserSTXPostCondition,
  createEscrowPostConditions,
  ConditionCodes,
} from '@/lib/post-conditions';

// Ensure user sends exactly 1 STX
const postCondition = createUserSTXPostCondition(
  userAddress,
  1000000n,
  ConditionCodes.EQUAL
);

// Escrow lock
const escrowConditions = createEscrowPostConditions(
  userAddress,
  'funds-keeper',
  1000000n
);
```

### 9. Response Parsing

Parse contract responses to TypeScript types:

```typescript
import { parseCampaign, parseUserProfile } from '@/lib/response-parsers';

const campaignCV = await callReadOnlyFunction({ ... });
const campaign = parseCampaign(campaignCV);

if (campaign) {
  console.log('Campaign created:', campaign.createdAt); // Unix timestamp
  const date = new Date(campaign.createdAt * 1000);
}
```

### 10. TypeScript Types

All contract types are fully typed:

```typescript
import { Campaign, UserProfile, AnalyticsMetrics } from '@/types/contracts';

const campaign: Campaign = {
  campaignId: 1,
  advertiser: 'SP2...',
  name: 'My Campaign',
  budget: 1000000n,
  spent: 0n,
  dailyBudget: 100000n,
  startHeight: 100,
  endHeight: 200,
  status: CampaignStatus.ACTIVE,
  createdAt: 1704067200, // Unix timestamp
  lastUpdated: 1704067200,
};
```

## Migration Checklist

- [x] Updated @stacks/* packages to v7+
- [x] Migrated network constants (StacksMainnet → STACKS_MAINNET)
- [x] Added Clarity v4 type definitions
- [x] Created value converter utilities
- [x] Built transaction builder utilities
- [x] Implemented post-condition helpers
- [x] Created read-only call utilities
- [x] Added comprehensive error handling
- [x] Defined contract TypeScript types
- [x] Built response parser utilities
- [x] Added React Query hooks
- [x] Updated documentation

## Benefits

✅ **Type Safety**: Full TypeScript support for all contract interactions
✅ **Better DX**: Simplified APIs with clear error messages
✅ **Performance**: Automatic caching with React Query
✅ **Security**: Post-condition builders prevent loss of funds
✅ **Maintainability**: Centralized utilities, easy to update
✅ **Clarity v4**: Full support for latest Clarity features

## Resources

- [Stacks.js v7 Documentation](https://docs.hiro.so/stacks.js)
- [Clarity v4 Reference](https://docs.stacks.co/clarity)
- [Transaction Guide](https://docs.hiro.so/stacks.js/guides/transactions)
- [React Query Docs](https://tanstack.com/query)

## Support

For issues or questions:
- Check the error handler output
- Review type definitions in `src/types/`
- Reference this migration guide
- Check Stacks.js v7 docs
