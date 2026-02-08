'use client';

import { useState } from 'react';
import { Check, X, Info } from 'lucide-react';
import type { SubscriptionPlan, BillingInterval } from './types';

interface PlanComparisonProps {
  onSelectPlan?: (plan: SubscriptionPlan, interval: BillingInterval) => void;
  currentPlanId?: string;
}

export function PlanComparison({ onSelectPlan, currentPlanId }: PlanComparisonProps) {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      tier: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      price: { monthly: 0, yearly: 0 },
      features: [],
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
      description: 'For small businesses',
      price: { monthly: 49, yearly: 470 },
      features: [],
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
      features: [],
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
      features: [],
      limits: {
        campaigns: -1,
        impressions: -1,
        apiCalls: -1,
        storage: -1,
        users: -1,
      },
    },
  ];

  const featureCategories = [
    {
      name: 'Core Features',
      features: [
        {
          name: 'Active Campaigns',
          key: 'campaigns',
          tooltip: 'Number of simultaneous advertising campaigns',
        },
        {
          name: 'Monthly Impressions',
          key: 'impressions',
          tooltip: 'Total ad impressions per month',
        },
        {
          name: 'API Calls',
          key: 'apiCalls',
          tooltip: 'Monthly API request limit',
        },
        {
          name: 'Storage',
          key: 'storage',
          tooltip: 'Storage space for assets and data',
        },
        {
          name: 'Team Members',
          key: 'users',
          tooltip: 'Number of users per account',
        },
      ],
    },
    {
      name: 'Analytics & Reporting',
      features: [
        {
          name: 'Basic Analytics',
          free: true,
          basic: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Advanced Analytics',
          free: false,
          basic: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Custom Reports',
          free: false,
          basic: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Real-time Data',
          free: false,
          basic: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Data Export',
          free: false,
          basic: true,
          pro: true,
          enterprise: true,
        },
      ],
    },
    {
      name: 'Advertising Features',
      features: [
        {
          name: 'Campaign Management',
          free: true,
          basic: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'A/B Testing',
          free: false,
          basic: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Automated Optimization',
          free: false,
          basic: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Custom Targeting',
          free: false,
          basic: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Geo-targeting',
          free: false,
          basic: false,
          pro: true,
          enterprise: true,
        },
      ],
    },
    {
      name: 'Customization',
      features: [
        {
          name: 'Custom Branding',
          free: false,
          basic: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'White-label Options',
          free: false,
          basic: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Custom Domain',
          free: false,
          basic: false,
          pro: false,
          enterprise: true,
        },
        {
          name: 'Custom Integrations',
          free: false,
          basic: false,
          pro: false,
          enterprise: true,
        },
      ],
    },
    {
      name: 'Support',
      features: [
        {
          name: 'Community Support',
          free: true,
          basic: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Email Support',
          free: false,
          basic: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Priority Support',
          free: false,
          basic: false,
          pro: true,
          enterprise: true,
        },
        {
          name: '24/7 Support',
          free: false,
          basic: false,
          pro: false,
          enterprise: true,
        },
        {
          name: 'Dedicated Account Manager',
          free: false,
          basic: false,
          pro: false,
          enterprise: true,
        },
      ],
    },
    {
      name: 'Security & Compliance',
      features: [
        {
          name: 'SSL Encryption',
          free: true,
          basic: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Two-Factor Authentication',
          free: true,
          basic: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'SOC 2 Compliance',
          free: false,
          basic: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'GDPR Compliance',
          free: false,
          basic: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'SLA Guarantee',
          free: false,
          basic: false,
          pro: false,
          enterprise: true,
        },
      ],
    },
  ];

  const formatLimitValue = (key: string, value: number) => {
    if (value === -1) return 'Unlimited';
    if (key === 'storage') return `${value} GB`;
    if (key === 'impressions' || key === 'apiCalls') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Compare Plans</h1>
        <p className="text-xl text-gray-600 mb-8">
          Find the perfect plan for your business needs
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

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Plan Headers */}
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-6 text-left w-1/3">
                  <span className="text-lg font-bold text-gray-900">Features</span>
                </th>
                {plans.map((plan) => (
                  <th key={plan.id} className="px-6 py-6 text-center relative">
                    {plan.popular && (
                      <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs font-semibold py-1">
                        MOST POPULAR
                      </div>
                    )}
                    <div className={plan.popular ? 'mt-4' : ''}>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {plan.price[billingInterval] === 0 ? (
                          'Free'
                        ) : (
                          <>
                            $
                            {billingInterval === 'monthly'
                              ? plan.price.monthly
                              : (plan.price.yearly / 12).toFixed(0)}
                          </>
                        )}
                      </div>
                      {plan.price[billingInterval] > 0 && (
                        <div className="text-sm text-gray-600">
                          per month{billingInterval === 'yearly' && ', billed yearly'}
                        </div>
                      )}
                      <button
                        onClick={() => onSelectPlan?.(plan, billingInterval)}
                        disabled={plan.id === currentPlanId}
                        className={`mt-4 w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                          plan.id === currentPlanId
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : plan.popular
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        {plan.id === currentPlanId ? 'Current Plan' : 'Select Plan'}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Feature Categories */}
            <tbody>
              {featureCategories.map((category, categoryIndex) => (
                <>
                  {/* Category Header */}
                  <tr key={`category-${categoryIndex}`} className="bg-gray-100">
                    <td
                      colSpan={plans.length + 1}
                      className="px-6 py-3 text-sm font-bold text-gray-900 uppercase tracking-wider"
                    >
                      {category.name}
                    </td>
                  </tr>

                  {/* Category Features */}
                  {category.features.map((feature, featureIndex) => (
                    <tr
                      key={`feature-${categoryIndex}-${featureIndex}`}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-gray-900 font-medium">{feature.name}</span>
                          {'tooltip' in feature && (
                            <button
                              className="ml-2 text-gray-400 hover:text-gray-600"
                              title={feature.tooltip}
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="px-6 py-4 text-center">
                          {'key' in feature ? (
                            <span className="font-semibold text-gray-900">
                              {formatLimitValue(
                                feature.key,
                                plan.limits[feature.key as keyof typeof plan.limits]
                              )}
                            </span>
                          ) : feature[plan.tier as keyof typeof feature] ? (
                            <Check className="w-6 h-6 text-green-600 mx-auto" />
                          ) : (
                            <X className="w-6 h-6 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Free Trial</h3>
          <p className="text-sm text-blue-800">
            Try any paid plan free for 14 days. No credit card required.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Money-Back Guarantee</h3>
          <p className="text-sm text-green-800">
            Not satisfied? Get a full refund within 30 days of purchase.
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Need Help?</h3>
          <p className="text-sm text-purple-800">
            Contact our sales team for custom plans and pricing.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <button className="text-blue-600 hover:text-blue-700 font-semibold">
          View All FAQs →
        </button>
      </div>
    </div>
  );
}
