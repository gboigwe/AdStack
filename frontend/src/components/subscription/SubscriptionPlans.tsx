'use client';

import { useState } from 'react';
import { Check, Zap, Star, Building2 } from 'lucide-react';
import type { SubscriptionPlan, BillingInterval } from './types';

interface SubscriptionPlansProps {
  onSelectPlan?: (plan: SubscriptionPlan, interval: BillingInterval) => void;
  currentPlanId?: string;
}

export function SubscriptionPlans({ onSelectPlan, currentPlanId }: SubscriptionPlansProps) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      tier: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      price: { monthly: 0, yearly: 0 },
      features: [
        '5 active campaigns',
        '10,000 impressions/month',
        '1,000 API calls/month',
        '1 GB storage',
        '1 user',
        'Community support',
        'Basic analytics',
      ],
      limits: {
        campaigns: 5,
        impressions: 10000,
        apiCalls: 1000,
        storage: 1,
        users: 1,
      },
    },
    {
      id: 'basic',
      tier: 'basic',
      name: 'Basic',
      description: 'For small businesses and startups',
      price: { monthly: 49, yearly: 470 },
      features: [
        '25 active campaigns',
        '100,000 impressions/month',
        '10,000 API calls/month',
        '10 GB storage',
        '3 users',
        'Email support',
        'Advanced analytics',
        'Custom branding',
      ],
      limits: {
        campaigns: 25,
        impressions: 100000,
        apiCalls: 10000,
        storage: 10,
        users: 3,
      },
    },
    {
      id: 'pro',
      tier: 'pro',
      name: 'Pro',
      description: 'For growing businesses',
      price: { monthly: 149, yearly: 1430 },
      features: [
        '100 active campaigns',
        '1,000,000 impressions/month',
        '100,000 API calls/month',
        '50 GB storage',
        '10 users',
        'Priority support',
        'Advanced analytics',
        'Custom branding',
        'API access',
        'White-label options',
        'A/B testing',
      ],
      limits: {
        campaigns: 100,
        impressions: 1000000,
        apiCalls: 100000,
        storage: 50,
        users: 10,
      },
      popular: true,
    },
    {
      id: 'enterprise',
      tier: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations',
      price: { monthly: 499, yearly: 4790 },
      features: [
        'Unlimited campaigns',
        'Unlimited impressions',
        'Unlimited API calls',
        'Unlimited storage',
        'Unlimited users',
        '24/7 dedicated support',
        'Advanced analytics',
        'Custom branding',
        'API access',
        'White-label options',
        'A/B testing',
        'Custom integrations',
        'SLA guarantee',
        'Dedicated account manager',
      ],
      limits: {
        campaigns: -1,
        impressions: -1,
        apiCalls: -1,
        storage: -1,
        users: -1,
      },
      custom: true,
    },
  ];

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Zap className="w-6 h-6" />;
      case 'basic':
        return <Check className="w-6 h-6" />;
      case 'pro':
        return <Star className="w-6 h-6" />;
      case 'enterprise':
        return <Building2 className="w-6 h-6" />;
      default:
        return null;
    }
  };

  const formatPrice = (plan: SubscriptionPlan) => {
    const price = billingInterval === 'monthly' ? plan.price.monthly : plan.price.yearly;
    if (price === 0) return 'Free';
    if (plan.custom) return 'Custom';

    if (billingInterval === 'yearly') {
      const monthlyEquivalent = price / 12;
      return (
        <div>
          <span className="text-4xl font-bold">${monthlyEquivalent.toFixed(0)}</span>
          <span className="text-gray-600 ml-2">/month</span>
          <div className="text-sm text-gray-500 mt-1">
            Billed ${price.toFixed(0)} yearly
          </div>
        </div>
      );
    }

    return (
      <div>
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-gray-600 ml-2">/month</span>
      </div>
    );
  };

  const getSavingsPercentage = (plan: SubscriptionPlan) => {
    if (plan.price.monthly === 0) return 0;
    const yearlyMonthly = plan.price.yearly / 12;
    return Math.round(((plan.price.monthly - yearlyMonthly) / plan.price.monthly) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600 mb-8">
          Select the perfect plan for your advertising needs
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'yearly'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs text-green-600 font-semibold">Save up to 20%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const savings = getSavingsPercentage(plan);

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
                plan.popular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8">
                {/* Icon & Name */}
                <div className="mb-4">
                  <div
                    className={`inline-flex p-3 rounded-lg mb-3 ${
                      plan.tier === 'free'
                        ? 'bg-gray-100 text-gray-600'
                        : plan.tier === 'basic'
                        ? 'bg-blue-100 text-blue-600'
                        : plan.tier === 'pro'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-gray-900 text-white'
                    }`}
                  >
                    {getPlanIcon(plan.tier)}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 mt-1">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {formatPrice(plan)}
                  {billingInterval === 'yearly' && savings > 0 && (
                    <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                      Save {savings}%
                    </span>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan?.(plan, billingInterval)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors mb-6 ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isCurrentPlan
                    ? 'Current Plan'
                    : plan.tier === 'enterprise'
                    ? 'Contact Sales'
                    : 'Get Started'}
                </button>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Link */}
      <div className="text-center mt-12">
        <p className="text-gray-600">
          Need help choosing?{' '}
          <button className="text-blue-600 hover:text-blue-700 font-semibold">
            Compare all features
          </button>
        </p>
      </div>
    </div>
  );
}
