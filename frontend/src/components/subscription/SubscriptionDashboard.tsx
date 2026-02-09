'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  TrendingUp,
  Settings,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { CurrentSubscription, UsageMetrics } from './types';

interface SubscriptionDashboardProps {
  onManagePlan?: () => void;
  onViewBilling?: () => void;
  onManagePayment?: () => void;
}

export function SubscriptionDashboard({
  onManagePlan,
  onViewBilling,
  onManagePayment,
}: SubscriptionDashboardProps) {
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      // TODO: Fetch subscription data from API
      // Placeholder data
      setSubscription({
        id: 'sub_1',
        plan: {
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
        },
        status: 'active',
        billingInterval: 'monthly',
        startDate: new Date('2024-01-01'),
        renewalDate: new Date('2024-03-01'),
        cancelAtPeriodEnd: false,
        autoRenew: true,
      });

      setUsage({
        campaigns: { used: 45, limit: 100, percentage: 45 },
        impressions: { used: 650000, limit: 1000000, percentage: 65 },
        apiCalls: { used: 75000, limit: 100000, percentage: 75 },
        storage: { used: 28, limit: 50, percentage: 56 },
        users: { used: 6, limit: 10, percentage: 60 },
      });
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      past_due: 'bg-red-100 text-red-800',
      canceled: 'bg-gray-100 text-gray-800',
      trialing: 'bg-blue-100 text-blue-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles] || styles.active}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilRenewal = () => {
    if (!subscription) return 0;
    const now = new Date();
    const renewal = new Date(subscription.renewalDate);
    const diff = renewal.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading subscription...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Subscription</h2>
          <p className="text-gray-600 mb-6">Subscribe to a plan to start using AdStack</p>
          <button
            onClick={onManagePlan}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Dashboard</h1>
        <p className="text-gray-600">Manage your subscription and billing</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center mb-4">
              <h2 className="text-3xl font-bold mr-4">{subscription.plan.name} Plan</h2>
              {getStatusBadge(subscription.status)}
            </div>
            <p className="text-blue-100 mb-6">{subscription.plan.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-blue-100 text-sm mb-1">Price</p>
                <p className="text-2xl font-bold">
                  $
                  {subscription.billingInterval === 'monthly'
                    ? subscription.plan.price.monthly
                    : subscription.plan.price.yearly / 12}
                  /mo
                </p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Billing</p>
                <p className="text-2xl font-bold capitalize">{subscription.billingInterval}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Next Billing</p>
                <p className="text-lg font-semibold">{formatDate(subscription.renewalDate)}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Days Until Renewal</p>
                <p className="text-2xl font-bold">{getDaysUntilRenewal()}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onManagePlan}
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Manage Plan
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={onManagePayment}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
        >
          <CreditCard className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Payment Methods</h3>
          <p className="text-gray-600 text-sm">Manage your payment methods</p>
        </button>

        <button
          onClick={onViewBilling}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
        >
          <Download className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Billing History</h3>
          <p className="text-gray-600 text-sm">View and download invoices</p>
        </button>

        <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
          <Settings className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Settings</h3>
          <p className="text-gray-600 text-sm">Configure subscription settings</p>
        </button>
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Usage Overview</h2>
          <p className="text-gray-600 text-sm mt-1">Current billing period usage</p>
        </div>
        <div className="p-6">
          {usage && (
            <div className="space-y-6">
              {Object.entries(usage).map(([key, metric]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {metric.used.toLocaleString()} of{' '}
                        {metric.limit === -1 ? 'unlimited' : metric.limit.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {metric.limit === -1 ? '∞' : `${metric.percentage}%`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metric.percentage >= 90
                          ? 'bg-red-600'
                          : metric.percentage >= 75
                          ? 'bg-yellow-600'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                    />
                  </div>
                  {metric.percentage >= 90 && (
                    <p className="text-xs text-red-600 mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Approaching limit - consider upgrading
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Auto-renewal Info */}
      {subscription.autoRenew && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
          <CheckCircle2 className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-900 font-medium">Auto-renewal is enabled</p>
            <p className="text-blue-700 text-sm mt-1">
              Your subscription will automatically renew on {formatDate(subscription.renewalDate)}
            </p>
          </div>
        </div>
      )}

      {/* Cancellation Notice */}
      {subscription.cancelAtPeriodEnd && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <Clock className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-900 font-medium">Subscription scheduled for cancellation</p>
            <p className="text-yellow-700 text-sm mt-1">
              Your subscription will end on {formatDate(subscription.renewalDate)}. You can
              reactivate anytime before then.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
