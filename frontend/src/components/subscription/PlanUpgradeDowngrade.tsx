'use client';

import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Check, AlertCircle, Calculator } from 'lucide-react';
import type { SubscriptionPlan, BillingInterval, ProrationPreview } from './types';

interface PlanUpgradeDowngradeProps {
  currentPlan: SubscriptionPlan;
  targetPlan: SubscriptionPlan;
  billingInterval: BillingInterval;
  onConfirm?: (preview: ProrationPreview) => void;
  onCancel?: () => void;
}

export function PlanUpgradeDowngrade({
  currentPlan,
  targetPlan,
  billingInterval,
  onConfirm,
  onCancel,
}: PlanUpgradeDowngradeProps) {
  const [preview, setPreview] = useState<ProrationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const isUpgrade = targetPlan.price[billingInterval] > currentPlan.price[billingInterval];

  useEffect(() => {
    calculateProration();
  }, [currentPlan, targetPlan, billingInterval]);

  const calculateProration = async () => {
    try {
      setLoading(true);

      // Simulate API call to calculate proration
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const today = new Date();
      const nextBillingDate = new Date(today);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + (billingInterval === 'monthly' ? 1 : 12));

      const daysInPeriod = billingInterval === 'monthly' ? 30 : 365;
      const daysRemaining = 20; // Simulated

      const currentPrice = currentPlan.price[billingInterval];
      const newPrice = targetPlan.price[billingInterval];

      const unusedAmount = (currentPrice / daysInPeriod) * daysRemaining;
      const proratedNewAmount = (newPrice / daysInPeriod) * daysRemaining;
      const immediateCharge = Math.max(0, proratedNewAmount - unusedAmount);

      setPreview({
        currentPlan,
        newPlan: targetPlan,
        billingInterval,
        unusedAmount,
        newAmount: newPrice,
        prorationAmount: unusedAmount,
        immediateCharge,
        nextBillingDate,
        effectiveDate: today,
      });
    } catch (error) {
      console.error('Failed to calculate proration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview || !agreed) return;

    try {
      setConfirming(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onConfirm?.(preview);
    } catch (error) {
      console.error('Failed to change plan:', error);
    } finally {
      setConfirming(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDifferences = () => {
    const differences: { feature: string; current: string; new: string }[] = [];

    Object.entries(targetPlan.limits).forEach(([key, value]) => {
      const currentValue = currentPlan.limits[key as keyof typeof currentPlan.limits];
      if (currentValue !== value) {
        differences.push({
          feature: key.charAt(0).toUpperCase() + key.slice(1),
          current: currentValue === -1 ? 'Unlimited' : currentValue.toString(),
          new: value === -1 ? 'Unlimited' : value.toString(),
        });
      }
    });

    return differences;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Calculating proration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className={`inline-flex p-4 rounded-full mb-4 ${isUpgrade ? 'bg-green-100' : 'bg-blue-100'}`}>
          {isUpgrade ? (
            <ArrowUp className="w-8 h-8 text-green-600" />
          ) : (
            <ArrowDown className="w-8 h-8 text-blue-600" />
          )}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isUpgrade ? 'Upgrade' : 'Downgrade'} Your Plan
        </h1>
        <p className="text-gray-600">
          Review the changes and confirm your plan {isUpgrade ? 'upgrade' : 'downgrade'}
        </p>
      </div>

      {/* Plan Comparison */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Current Plan */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
          <div className="text-center mb-4">
            <span className="text-sm font-medium text-gray-500 uppercase">Current Plan</span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{currentPlan.name}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-4">
              ${currentPlan.price[billingInterval]}
              <span className="text-lg text-gray-600">
                /{billingInterval === 'monthly' ? 'mo' : 'yr'}
              </span>
            </p>
          </div>
        </div>

        {/* New Plan */}
        <div className={`border-2 rounded-lg p-6 ${isUpgrade ? 'bg-green-50 border-green-500' : 'bg-blue-50 border-blue-500'}`}>
          <div className="text-center mb-4">
            <span className={`text-sm font-medium uppercase ${isUpgrade ? 'text-green-600' : 'text-blue-600'}`}>
              New Plan
            </span>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{targetPlan.name}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-4">
              ${targetPlan.price[billingInterval]}
              <span className="text-lg text-gray-600">
                /{billingInterval === 'monthly' ? 'mo' : 'yr'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Feature Differences */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">What Changes?</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {getDifferences().map((diff, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <span className="text-gray-700 font-medium">{diff.feature}</span>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-4">{diff.current}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 mr-4" />
                  <span className={`font-semibold ${isUpgrade ? 'text-green-600' : 'text-blue-600'}`}>
                    {diff.new}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Proration Details */}
      {preview && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <Calculator className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Billing Details</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Unused amount from current plan</span>
                <span className="font-semibold">${preview.unusedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Prorated cost for new plan</span>
                <span className="font-semibold">
                  ${(preview.immediateCharge + preview.unusedAmount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Credit from current plan</span>
                <span className="font-semibold text-green-600">-${preview.unusedAmount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    {isUpgrade ? 'Amount due today' : 'Credit applied'}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${preview.immediateCharge.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Next billing date</span>
                  <span>{formatDate(preview.nextBillingDate)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>Next billing amount</span>
                  <span>${preview.newAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">Important Information</h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>
                • {isUpgrade ? 'Your plan will be upgraded immediately after confirmation' : 'Your plan will be downgraded at the end of the current billing period'}
              </li>
              <li>• You will have immediate access to all {targetPlan.name} plan features</li>
              <li>
                • {isUpgrade ? 'You will be charged the prorated amount today' : 'Credit will be applied to your next billing cycle'}
              </li>
              <li>• You can change your plan again at any time</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-start">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
          />
          <label htmlFor="agree" className="text-sm text-gray-700">
            I understand that {isUpgrade ? 'I will be charged immediately' : 'my plan will change at the end of the billing period'} and
            that I can change my plan again at any time. I agree to the updated{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">
              Terms of Service
            </a>
            .
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onCancel}
          disabled={confirming}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!agreed || confirming}
          className={`px-8 py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${
            isUpgrade
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {confirming ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </span>
          ) : (
            `Confirm ${isUpgrade ? 'Upgrade' : 'Downgrade'}`
          )}
        </button>
      </div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
