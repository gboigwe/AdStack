# Subscription & Recurring Payment System Documentation

Complete guide for the AdStack subscription and recurring payment system.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Smart Contracts](#smart-contracts)
4. [Frontend Components](#frontend-components)
5. [Subscription Tiers](#subscription-tiers)
6. [Payment Processing](#payment-processing)
7. [Usage Limits](#usage-limits)
8. [Integration Guide](#integration-guide)
9. [API Reference](#api-reference)
10. [Testing](#testing)

## Overview

The AdStack Subscription & Recurring Payment System enables SaaS-style recurring revenue through tiered subscription plans with automatic billing, usage tracking, and feature gating.

### Key Features

- **4 Subscription Tiers**: Free, Basic, Pro, Enterprise
- **Auto-Renewal**: Automatic payment processing on billing cycle
- **Payment Retry**: Up to 3 automatic retry attempts on failure
- **Grace Period**: 7-day grace period after max retries
- **Feature Gating**: Access control based on subscription tier
- **Usage Tracking**: Real-time quota monitoring and enforcement
- **Tier Transitions**: Seamless upgrades and downgrades with proration
- **Billing Management**: Complete billing history and invoice generation
- **Payment Methods**: Multiple payment method support
- **Cancellation**: Immediate or scheduled cancellation options

## Architecture

```
┌──────────────────────────────────────────────────┐
│           Frontend Components                     │
│  (React/TypeScript - 12 components)              │
└─────────────────┬────────────────────────────────┘
                  │
                  │ API Calls
                  ▼
┌──────────────────────────────────────────────────┐
│         Smart Contracts (Clarity v4)              │
├──────────────────────────────────────────────────┤
│  1. subscription-manager.clar                     │
│     - Plans, enrollments, lifecycle              │
│                                                   │
│  2. recurring-payment.clar                        │
│     - Payment execution, retries, refunds        │
│                                                   │
│  3. subscription-benefits.clar                    │
│     - Feature gating, usage limits, tiers        │
└──────────────────────────────────────────────────┘
```

### Data Flow

1. **User subscribes** → subscription-manager creates subscription
2. **Payment scheduled** → recurring-payment schedules first payment
3. **Benefits activated** → subscription-benefits grants feature access
4. **Usage tracked** → benefits contract monitors quota usage
5. **Payment due** → recurring-payment processes renewal
6. **Failure handling** → retry mechanism with grace period
7. **Tier changes** → prorated billing and feature updates

## Smart Contracts

### 1. subscription-manager.clar

Manages subscription plans, user enrollments, and lifecycle.

#### Key Functions

**Create Plan**
```clarity
(create-plan
  (name (string-ascii 50))
  (description (string-utf8 256))
  (price uint)
  (billing-period uint)
  (features (list 10 (string-ascii 50)))
  (max-campaigns uint)
  (max-impressions uint)
)
```

**Subscribe**
```clarity
(subscribe (plan-id uint))
```

**Cancel Subscription**
```clarity
(cancel-subscription (immediate bool))
```

**Change Plan**
```clarity
(change-plan (new-plan-id uint))
```

#### Billing Periods
- Monthly: `period-monthly` (u1)
- Quarterly: `period-quarterly` (u3)
- Yearly: `period-yearly` (u12)

#### Subscription Status
- Active: `status-active` (u1)
- Past Due: `status-past-due` (u2)
- Canceled: `status-canceled` (u3)
- Expired: `status-expired` (u4)
- Grace Period: `status-grace-period` (u5)

### 2. recurring-payment.clar

Handles scheduled payment execution, retries, and refunds.

#### Key Functions

**Schedule Payment**
```clarity
(schedule-payment
  (subscription-id uint)
  (amount uint)
  (due-date uint)
  (payment-method-id uint)
)
```

**Process Payment**
```clarity
(process-payment (payment-id uint))
```

**Request Refund**
```clarity
(request-refund
  (payment-id uint)
  (amount uint)
  (reason (string-utf8 256))
)
```

**Add Payment Method**
```clarity
(add-payment-method
  (method-type uint)
  (identifier (string-ascii 100))
  (is-default bool)
)
```

#### Payment Status
- Pending: `u1`
- Processing: `u2`
- Success: `u3`
- Failed: `u4`
- Refunded: `u5`
- Cancelled: `u6`

#### Retry Mechanism
- **Max Retries**: 3 attempts
- **Retry Delay**: 24 hours between attempts
- **Grace Period**: 7 days after max retries
- **Auto-Cancel**: After grace period expiration

### 3. subscription-benefits.clar

Manages feature access, usage limits, and tier benefits.

#### Key Functions

**Check Feature Access**
```clarity
(can-access-feature (user principal) (feature-id uint))
```

**Check Usage Limit**
```clarity
(check-usage-limit
  (user principal)
  (usage-type uint)
  (amount uint)
)
```

**Upgrade Tier**
```clarity
(upgrade-tier
  (user principal)
  (new-tier-id uint)
  (immediate bool)
)
```

**Track Usage**
```clarity
(track-usage
  (user principal)
  (usage-type uint)
  (amount uint)
)
```

#### Feature IDs
1. Basic Campaigns
2. Advanced Analytics
3. Custom Targeting
4. API Access
5. Priority Support
6. White Label
7. Advanced Reporting
8. Bulk Operations
9. Team Collaboration
10. Custom Integrations

#### Usage Types
1. Campaigns
2. Impressions
3. Clicks
4. Conversions
5. API Calls
6. Team Members
7. Storage (GB)
8. Reports

## Frontend Components

### Component Overview

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| SubscriptionPlans | Display tiers | Pricing, features, CTAs |
| CheckoutFlow | Purchase flow | 4-step process, validation |
| PaymentMethods | Manage payments | Add/remove cards, defaults |
| SubscriptionDashboard | Main hub | Overview, stats, actions |
| UsageTracking | Monitor quotas | Progress bars, warnings |
| PlanUpgradeDowngrade | Tier changes | Proration, confirmation |
| BillingHistory | Invoice list | Search, download, status |
| InvoiceGenerator | Invoice display | Professional layout, PDF |
| PaymentAlerts | Notifications | Failed payments, renewals |
| CancellationFlow | Cancel process | Feedback, confirmation |
| RenewalReminders | Renewal settings | Auto-renew, notifications |
| PlanComparison | Feature matrix | Side-by-side comparison |

### Usage Examples

#### Display Subscription Plans

```tsx
import { SubscriptionPlans } from '@/components/subscription';

function PricingPage() {
  const handleSelectPlan = (planId: string) => {
    // Navigate to checkout
    router.push(`/checkout?plan=${planId}`);
  };

  return (
    <div>
      <h1>Choose Your Plan</h1>
      <SubscriptionPlans
        onSelectPlan={handleSelectPlan}
        currentPlanId="basic"
      />
    </div>
  );
}
```

#### Subscription Dashboard

```tsx
import { SubscriptionDashboard } from '@/components/subscription';

function AccountPage() {
  const subscription = {
    planName: 'Pro',
    price: 99,
    billingCycle: 'Monthly',
    nextBillingDate: new Date('2024-02-01'),
    autoRenew: true,
    status: 'active'
  };

  return <SubscriptionDashboard subscription={subscription} />;
}
```

#### Usage Tracking

```tsx
import { UsageTracking } from '@/components/subscription';

function UsagePage() {
  const usage = {
    campaigns: { used: 8, limit: 10 },
    impressions: { used: 750000, limit: 1000000 },
    apiCalls: { used: 4500, limit: 10000 },
    storage: { used: 2.5, limit: 5 },
    users: { used: 3, limit: 5 }
  };

  return <UsageTracking usage={usage} />;
}
```

## Subscription Tiers

### Free Tier
- **Price**: $0/month
- **Campaigns**: 1
- **Impressions**: 10,000/month
- **Features**: Basic campaigns only
- **Support**: Community
- **Best For**: Testing the platform

### Basic Tier
- **Price**: $29/month or $290/year (save $58)
- **Campaigns**: 5
- **Impressions**: 100,000/month
- **Features**:
  - Basic campaigns
  - Basic analytics
  - Email support
- **Support**: Email (48h response)
- **Best For**: Small businesses

### Pro Tier ⭐ Most Popular
- **Price**: $99/month or $990/year (save $198)
- **Campaigns**: 20
- **Impressions**: 1,000,000/month
- **Features**:
  - All Basic features
  - Advanced analytics
  - Custom targeting
  - API access
  - Priority support
- **Support**: Priority email (24h response)
- **Best For**: Growing businesses

### Enterprise Tier
- **Price**: $499/month or $4,990/year (save $998)
- **Campaigns**: Unlimited
- **Impressions**: 10,000,000+/month
- **Features**:
  - All Pro features
  - White label
  - Advanced reporting
  - Bulk operations
  - Team collaboration
  - Custom integrations
  - Dedicated support
- **Support**: Dedicated account manager
- **Best For**: Large organizations

## Payment Processing

### Payment Flow

1. **User subscribes** → Initial payment processed
2. **Subscription created** → Next billing date set
3. **Renewal scheduled** → Added to payment queue
4. **Payment due** → Automatic processing triggered
5. **Payment success** → Subscription renewed, next cycle scheduled
6. **Payment failure** → Retry mechanism activated

### Retry Logic

```
Payment Failed
    ↓
Attempt 1 (Immediate)
    ↓ (24h delay)
Attempt 2
    ↓ (24h delay)
Attempt 3
    ↓
If Still Failed → Grace Period (7 days)
    ↓
If Not Resolved → Subscription Canceled
```

### Proration Calculation

**Upgrade Mid-Cycle**
```
Unused days on current plan = Days remaining / Total days
Credit = Current plan price × Unused days ratio
Amount due = New plan price - Credit
```

**Example**:
- Current plan: $29/month, 15 days remaining
- New plan: $99/month
- Credit: $29 × (15/30) = $14.50
- Amount due: $99 - $14.50 = $84.50

### Refund Policy

- **Refund Window**: 30 days from payment
- **Refund Types**:
  - Full refund (within 7 days)
  - Prorated refund (8-30 days)
  - No refund after 30 days
- **Processing Time**: 5-7 business days

## Usage Limits

### Quota Enforcement

**Hard Limits** (Block access when reached):
- Free: Campaigns, Team Members
- Basic: Campaigns, Team Members
- Pro: Campaigns, Team Members
- Enterprise: None (soft limits only)

**Soft Limits** (Overage fees apply):
- Impressions (all tiers)
- API Calls (all tiers)
- Storage (all tiers)

### Overage Fees

| Tier | Impressions (per 1k) | API Calls (per 100) | Storage (per GB) |
|------|---------------------|---------------------|------------------|
| Free | N/A (hard limit) | N/A (hard limit) | N/A (hard limit) |
| Basic | $0.50 | $0.10 | $0.20 |
| Pro | $0.30 | $0.05 | $0.15 |
| Enterprise | $0.15 | $0.02 | $0.10 |

### Usage Alerts

- **75% Usage**: Warning notification
- **90% Usage**: Critical warning with upgrade prompt
- **100% Usage**: Limit reached notification

## Integration Guide

### Backend Integration

#### 1. Initialize Subscription Service

```typescript
import { SubscriptionManager } from '@/lib/subscription';

const subscriptionManager = new SubscriptionManager({
  contractAddress: 'SP1...subscription-manager',
  network: 'mainnet'
});
```

#### 2. Create Subscription

```typescript
async function createSubscription(userId: string, planId: number) {
  try {
    const result = await subscriptionManager.subscribe({
      planId,
      userId,
      paymentMethodId: defaultPaymentMethod.id
    });

    return {
      success: true,
      subscriptionId: result.subscriptionId
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

#### 3. Check Feature Access

```typescript
async function canAccessFeature(userId: string, featureId: number) {
  const hasAccess = await subscriptionManager.checkFeatureAccess(
    userId,
    featureId
  );

  if (!hasAccess) {
    throw new Error('Feature not available in your plan. Please upgrade.');
  }

  return true;
}
```

#### 4. Track Usage

```typescript
async function trackUsage(userId: string, usageType: number, amount: number) {
  const result = await subscriptionManager.trackUsage({
    userId,
    usageType,
    amount
  });

  if (!result.success && result.limitExceeded) {
    // Show upgrade prompt
    showUpgradeModal(userId);
  }

  return result;
}
```

### Frontend Integration

#### 1. Check Subscription Status

```typescript
import { useSubscription } from '@/hooks/useSubscription';

function FeatureComponent() {
  const { subscription, loading, error } = useSubscription();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  if (!subscription || subscription.tier === 'free') {
    return <UpgradePrompt feature="Advanced Analytics" />;
  }

  return <AdvancedAnalytics />;
}
```

#### 2. Protect Routes

```typescript
import { withSubscription } from '@/hoc/withSubscription';

const ProtectedPage = () => {
  return <AdvancedFeature />;
};

export default withSubscription(ProtectedPage, {
  requiredTier: 'pro',
  requiredFeatures: ['advanced-analytics']
});
```

#### 3. Usage Monitoring

```typescript
import { useUsage } from '@/hooks/useUsage';

function CampaignCreator() {
  const { usage, checkLimit } = useUsage();

  const handleCreateCampaign = async () => {
    const canCreate = await checkLimit('campaigns', 1);

    if (!canCreate) {
      showLimitReachedModal();
      return;
    }

    // Proceed with campaign creation
    await createCampaign();
  };

  return (
    <div>
      <p>Campaigns: {usage.campaigns.used} / {usage.campaigns.limit}</p>
      <Button onClick={handleCreateCampaign}>Create Campaign</Button>
    </div>
  );
}
```

## API Reference

### REST API Endpoints

#### Get Subscription

```http
GET /api/subscription/:userId
```

**Response:**
```json
{
  "subscriptionId": 123,
  "planId": 2,
  "planName": "Pro",
  "status": "active",
  "currentPeriodStart": "2024-01-01T00:00:00Z",
  "currentPeriodEnd": "2024-02-01T00:00:00Z",
  "autoRenew": true,
  "cancelAtPeriodEnd": false
}
```

#### Get Usage

```http
GET /api/usage/:userId
```

**Response:**
```json
{
  "campaigns": { "used": 8, "limit": 20 },
  "impressions": { "used": 750000, "limit": 1000000 },
  "apiCalls": { "used": 4500, "limit": 10000 },
  "storage": { "used": 2.5, "limit": 5 },
  "users": { "used": 3, "limit": 5 }
}
```

#### Create Subscription

```http
POST /api/subscription
```

**Body:**
```json
{
  "planId": 2,
  "paymentMethodId": "pm_123",
  "billingInterval": "monthly"
}
```

#### Cancel Subscription

```http
POST /api/subscription/:id/cancel
```

**Body:**
```json
{
  "immediate": false,
  "feedback": "Too expensive",
  "additionalComments": "Great product, but need to cut costs"
}
```

## Testing

### Smart Contract Tests

```bash
# Test subscription-manager
clarinet test contracts/subscription-manager.test.ts

# Test recurring-payment
clarinet test contracts/recurring-payment.test.ts

# Test subscription-benefits
clarinet test contracts/subscription-benefits.test.ts
```

### Frontend Component Tests

```bash
# Test all subscription components
npm test -- subscription

# Test specific component
npm test -- SubscriptionDashboard
```

### Integration Tests

```bash
# End-to-end subscription flow
npm run test:e2e -- subscription-flow
```

### Load Testing

```bash
# Test payment processing under load
npm run test:load -- payment-processing --clients=100
```

## Support

- **Documentation**: https://docs.adstack.io/subscription
- **GitHub Issues**: https://github.com/adstack/issues
- **Discord**: https://discord.gg/adstack
- **Email**: support@adstack.io

## License

MIT License - See LICENSE file for details
