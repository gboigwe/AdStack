# Subscription System Integration Examples

This directory contains comprehensive examples showing how to integrate the AdStack Subscription & Recurring Payment System into your application.

## Examples

### 1. subscription-integration.tsx

Complete subscription system integration showing:

#### Full Dashboard Integration
- Multi-tab interface with Overview, Usage, Billing, Payment, Reminders, and Plans
- Conditional rendering based on subscription status
- Loading states and error handling
- Responsive layout

#### Protected Feature Access
- Feature gating based on subscription tier
- Upgrade prompts for premium features
- Graceful fallback for unauthorized access
- Clear pricing and value proposition

#### Usage Limit Checks
- Pre-action limit validation
- User-friendly limit reached messages
- Automatic usage tracking after actions
- Upgrade prompts when limits reached

#### Payment Failure Handling
- Past due status alerts
- Grace period warnings with countdown
- Clear call-to-actions for payment updates
- Visual hierarchy with color-coded alerts

## Getting Started

### 1. Install Dependencies

```bash
npm install @tanstack/react-query lucide-react date-fns
```

### 2. Setup React Query

```tsx
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 3. Configure Subscription Hook

```tsx
// hooks/useSubscription.ts - already created in frontend/src/hooks/
```

### 4. Use in Your App

```tsx
import SubscriptionIntegrationExample from '@/examples/subscription/subscription-integration';

export default function SubscriptionPage() {
  return <SubscriptionIntegrationExample />;
}
```

## Common Patterns

### Pattern 1: Check Feature Access

```tsx
import { useSubscription } from '@/hooks/useSubscription';

function PremiumFeature() {
  const { hasFeatureAccess } = useSubscription();

  if (!hasFeatureAccess('advanced-analytics')) {
    return <UpgradePrompt feature="Advanced Analytics" />;
  }

  return <AdvancedAnalyticsComponent />;
}
```

### Pattern 2: Check Usage Limits

```tsx
import { useUsage } from '@/hooks/useUsage';

function ActionButton() {
  const { checkLimit, trackUsage } = useUsage();

  const handleAction = async () => {
    const canProceed = await checkLimit('campaigns', 1);

    if (!canProceed) {
      showUpgradeModal();
      return;
    }

    await performAction();
    await trackUsage('campaigns', 1);
  };

  return <button onClick={handleAction}>Create Campaign</button>;
}
```

### Pattern 3: Handle Payment States

```tsx
import { useSubscription } from '@/hooks/useSubscription';

function SubscriptionAlert() {
  const { subscription } = useSubscription();

  if (subscription?.status === 'past_due') {
    return <PaymentFailedAlert />;
  }

  if (subscription?.status === 'grace_period') {
    return <GracePeriodWarning />;
  }

  return null;
}
```

### Pattern 4: Display Usage with Progress

```tsx
import { useUsage } from '@/hooks/useUsage';

function UsageDisplay() {
  const { usage } = useUsage();

  return (
    <div>
      {Object.entries(usage).map(([key, data]) => (
        <div key={key}>
          <p>{key}: {data.used} / {data.limit}</p>
          <progress value={data.used} max={data.limit} />
        </div>
      ))}
    </div>
  );
}
```

### Pattern 5: Protected Route

```tsx
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

function ProtectedPage() {
  const { subscription, loading } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!subscription || subscription.status === 'canceled')) {
      router.push('/plans');
    }
  }, [subscription, loading, router]);

  if (loading) return <LoadingSpinner />;

  return <YourProtectedContent />;
}
```

## Best Practices

### 1. Always Check Feature Access

```tsx
// ✅ Good
if (hasFeatureAccess('advanced-analytics')) {
  // Show feature
}

// ❌ Bad
if (subscription.tier === 'pro') {
  // Show feature - doesn't account for enterprise or custom plans
}
```

### 2. Provide Clear Upgrade Paths

```tsx
// ✅ Good
<div>
  <p>This feature requires Pro plan</p>
  <button onClick={navigateToPlans}>Upgrade Now</button>
</div>

// ❌ Bad
<div>
  <p>Access denied</p>
</div>
```

### 3. Handle Loading States

```tsx
// ✅ Good
if (loading) return <Skeleton />;
if (error) return <ErrorMessage />;
return <Content />;

// ❌ Bad
return loading ? null : <Content />;
```

### 4. Track Usage Immediately

```tsx
// ✅ Good
await performAction();
await trackUsage('campaigns', 1);

// ❌ Bad
await performAction();
// Forgot to track usage
```

### 5. Provide Feedback

```tsx
// ✅ Good
const handleAction = async () => {
  setLoading(true);
  try {
    await performAction();
    toast.success('Action completed');
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};

// ❌ Bad
const handleAction = async () => {
  await performAction(); // No feedback
};
```

## Error Handling

### Subscription Not Found

```tsx
if (!subscription) {
  return (
    <div>
      <h1>No Active Subscription</h1>
      <p>Start with a free plan or upgrade to unlock features</p>
      <button onClick={() => router.push('/plans')}>
        View Plans
      </button>
    </div>
  );
}
```

### Payment Method Missing

```tsx
if (!paymentMethods || paymentMethods.length === 0) {
  return (
    <Alert variant="warning">
      <p>No payment method on file</p>
      <button onClick={() => router.push('/subscription/payment-methods')}>
        Add Payment Method
      </button>
    </Alert>
  );
}
```

### Usage Limit Exceeded

```tsx
const { checkLimit } = useUsage();

const canCreate = await checkLimit('campaigns', 1);
if (!canCreate) {
  toast.error('Campaign limit reached. Upgrade your plan for more campaigns.');
  return;
}
```

## Testing

### Test Subscription State

```tsx
import { renderWithProviders } from '@/test/utils';
import { useSubscription } from '@/hooks/useSubscription';

it('shows upgrade prompt for free tier', () => {
  const { getByText } = renderWithProviders(<Component />, {
    subscription: { tier: 'free' }
  });

  expect(getByText(/upgrade/i)).toBeInTheDocument();
});
```

### Test Usage Limits

```tsx
it('prevents action when limit reached', async () => {
  const { getByRole } = renderWithProviders(<Component />, {
    usage: { campaigns: { used: 10, limit: 10 } }
  });

  const button = getByRole('button');
  await userEvent.click(button);

  expect(getByText(/limit reached/i)).toBeInTheDocument();
});
```

## Troubleshooting

### Issue: Subscription not loading

**Solution**: Check if wallet is connected
```tsx
const { address } = useWalletStore();
if (!address) return <ConnectWallet />;
```

### Issue: Usage not updating

**Solution**: Invalidate queries after tracking
```tsx
await trackUsage('campaigns', 1);
queryClient.invalidateQueries(['usage']);
```

### Issue: Payment status not showing

**Solution**: Enable auto-refetch
```tsx
const { subscription } = useSubscription({
  refetchInterval: 30000 // 30 seconds
});
```

## Next Steps

1. Review the [Subscription System Documentation](../../docs/SUBSCRIPTION_SYSTEM.md)
2. Check the [Smart Contract Reference](../../contracts/)
3. Explore [Component Documentation](../../frontend/src/components/subscription/)
4. Test with [Contract Tests](../../tests/subscription-manager_test.ts)

## Support

- **GitHub Issues**: https://github.com/adstack/issues
- **Discord**: https://discord.gg/adstack
- **Documentation**: https://docs.adstack.io/subscription
