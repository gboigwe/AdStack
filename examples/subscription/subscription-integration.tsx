/**
 * Complete Subscription System Integration Example
 *
 * This example shows how to integrate all subscription components
 * into a complete subscription management system.
 */

import React from 'react';
import { useRouter } from 'next/router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SubscriptionPlans,
  SubscriptionDashboard,
  UsageTracking,
  BillingHistory,
  PaymentMethods,
  RenewalReminders,
  PlanComparison,
} from '@/components/subscription';
import { useSubscription, useUsage } from '@/hooks';
import { Card, CardContent } from '@/components/ui/card';

export default function SubscriptionIntegrationExample() {
  const router = useRouter();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { usage, loading: usageLoading } = useUsage();

  const handleSelectPlan = (planId: string) => {
    router.push(`/checkout?plan=${planId}`);
  };

  const handleUpgrade = () => {
    router.push('/plans');
  };

  if (subscriptionLoading || usageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  // If no subscription, show plans
  if (!subscription || subscription.status === 'canceled') {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">
            Select the perfect plan for your advertising needs
          </p>
        </div>

        <SubscriptionPlans
          onSelectPlan={handleSelectPlan}
          currentPlanId={subscription?.planId}
        />

        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Compare All Features
          </h2>
          <PlanComparison />
        </div>
      </div>
    );
  }

  // If has subscription, show dashboard
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SubscriptionDashboard subscription={subscription} />
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <UsageTracking usage={usage} onUpgrade={handleUpgrade} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingHistory userId={subscription.userId} />
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <PaymentMethods userId={subscription.userId} />
        </TabsContent>

        <TabsContent value="reminders" className="space-y-6">
          <RenewalReminders subscription={subscription} />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold mb-4">Available Plans</h3>
              <SubscriptionPlans
                onSelectPlan={handleSelectPlan}
                currentPlanId={subscription.planId}
              />
            </CardContent>
          </Card>

          <PlanComparison currentPlanId={subscription.planId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Protected Route Example
 *
 * Shows how to protect routes based on subscription tier
 */
export function ProtectedFeatureExample() {
  const { subscription, hasFeatureAccess } = useSubscription();
  const requiredFeature = 'advanced-analytics';

  if (!hasFeatureAccess(requiredFeature)) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Premium Feature</h1>
          <p className="text-xl text-gray-600 mb-8">
            Advanced Analytics is available on Pro and Enterprise plans
          </p>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">
                Unlock Advanced Analytics
              </h3>
              <ul className="text-left space-y-2 mb-6">
                <li>✓ Real-time campaign performance tracking</li>
                <li>✓ Advanced demographic insights</li>
                <li>✓ Custom report generation</li>
                <li>✓ Predictive analytics with AI</li>
                <li>✓ Competitor benchmarking</li>
              </ul>

              <button
                onClick={() => window.location.href = '/plans'}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Upgrade to Pro Plan - $99/month
              </button>
            </CardContent>
          </Card>

          <p className="text-sm text-gray-500">
            Already have a Pro plan? Contact support if you're still seeing this message.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Render the actual feature */}
      <h1>Advanced Analytics Dashboard</h1>
      {/* ...rest of component */}
    </div>
  );
}

/**
 * Usage Limit Check Example
 *
 * Shows how to check usage limits before performing actions
 */
export function CampaignCreatorExample() {
  const router = useRouter();
  const { checkLimit, trackUsage, usage } = useUsage();
  const [creating, setCreating] = React.useState(false);

  const handleCreateCampaign = async () => {
    // Check if user can create more campaigns
    const canCreate = await checkLimit('campaigns', 1);

    if (!canCreate) {
      // Show upgrade modal
      const shouldUpgrade = window.confirm(
        `You've reached your campaign limit (${usage.campaigns.limit}). Would you like to upgrade your plan?`
      );

      if (shouldUpgrade) {
        router.push('/plans');
      }
      return;
    }

    setCreating(true);
    try {
      // Create campaign
      const campaign = await createCampaign();

      // Track usage
      await trackUsage('campaigns', 1);

      // Navigate to campaign
      router.push(`/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Failed to create campaign:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Campaigns</h1>
          <p className="text-gray-600 mt-2">
            {usage.campaigns.used} of {usage.campaigns.limit} campaigns used
          </p>
        </div>

        <button
          onClick={handleCreateCampaign}
          disabled={creating || usage.campaigns.used >= usage.campaigns.limit}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {creating ? 'Creating...' : 'Create Campaign'}
        </button>
      </div>

      {/* Campaign list */}
    </div>
  );
}

/**
 * Payment Failure Handling Example
 *
 * Shows how to handle payment failures gracefully
 */
export function PaymentFailureExample() {
  const { subscription } = useSubscription();
  const router = useRouter();

  if (subscription?.status === 'past_due') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-yellow-800">Payment Failed</h3>
            <p className="mt-2 text-sm text-yellow-700">
              We couldn't process your last payment. Please update your payment method to avoid service interruption.
            </p>
            <div className="mt-4">
              <button
                onClick={() => router.push('/subscription/payment-methods')}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
              >
                Update Payment Method
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subscription?.status === 'grace_period') {
    const daysLeft = Math.ceil(
      (new Date(subscription.gracePeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-red-800">Service Suspension Warning</h3>
            <p className="mt-2 text-sm text-red-700">
              Your subscription will be canceled in {daysLeft} day{daysLeft !== 1 ? 's' : ''} if payment is not received.
            </p>
            <p className="mt-2 text-sm text-red-700 font-semibold">
              Your campaigns will stop running after grace period expires!
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => router.push('/subscription/payment-methods')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Update Payment Method Now
              </button>
              <button
                onClick={() => router.push('/subscription/billing')}
                className="border border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
              >
                View Billing History
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Mock function - replace with actual API call
async function createCampaign() {
  return { id: '123', name: 'New Campaign' };
}
