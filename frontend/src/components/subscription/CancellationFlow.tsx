'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, MessageSquare, Star } from 'lucide-react';
import type { CurrentSubscription, CancellationFeedback } from './types';

interface CancellationFlowProps {
  subscription: CurrentSubscription;
  onConfirmCancel?: (feedback: CancellationFeedback) => void;
  onKeepSubscription?: () => void;
}

type CancellationStep = 'reason' | 'feedback' | 'confirmation' | 'complete';

export function CancellationFlow({
  subscription,
  onConfirmCancel,
  onKeepSubscription,
}: CancellationFlowProps) {
  const [currentStep, setCurrentStep] = useState<CancellationStep>('reason');
  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState<CancellationFeedback>({
    reason: '',
    comments: '',
    wouldRecommend: true,
    features: [],
    pricing: undefined,
  });

  const reasons = [
    { value: 'too_expensive', label: 'Too expensive' },
    { value: 'not_using', label: 'Not using enough' },
    { value: 'missing_features', label: 'Missing features' },
    { value: 'switching_competitor', label: 'Switching to competitor' },
    { value: 'technical_issues', label: 'Technical issues' },
    { value: 'temporary_pause', label: 'Temporary pause' },
    { value: 'other', label: 'Other reason' },
  ];

  const features = [
    'Campaign Management',
    'Analytics Dashboard',
    'API Access',
    'Custom Branding',
    'A/B Testing',
    'White-label Options',
    'Priority Support',
    'Advanced Reporting',
  ];

  const handleNext = () => {
    const steps: CancellationStep[] = ['reason', 'feedback', 'confirmation', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: CancellationStep[] = ['reason', 'feedback', 'confirmation', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onConfirmCancel?.(feedback);
      setCurrentStep('complete');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (feature: string) => {
    setFeedback((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Progress Indicator */}
      {currentStep !== 'complete' && (
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2">
            {['reason', 'feedback', 'confirmation'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === step
                      ? 'bg-blue-600 text-white'
                      : ['reason', 'feedback', 'confirmation'].indexOf(currentStep) > index
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {['reason', 'feedback', 'confirmation'].indexOf(currentStep) > index ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 2 && (
                  <div
                    className={`w-12 h-0.5 ${
                      ['reason', 'feedback', 'confirmation'].indexOf(currentStep) > index
                        ? 'bg-green-600'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Step 1: Reason */}
        {currentStep === 'reason' && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex p-4 rounded-full bg-yellow-100 mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                We're sorry to see you go
              </h2>
              <p className="text-gray-600">
                Help us improve by telling us why you're canceling
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {reasons.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    feedback.reason === reason.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={feedback.reason === reason.value}
                    onChange={(e) => setFeedback({ ...feedback, reason: e.target.value })}
                    className="mr-3 w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-900 font-medium">{reason.label}</span>
                </label>
              ))}
            </div>

            {feedback.reason === 'other' && (
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please tell us more
                </label>
                <textarea
                  value={feedback.comments}
                  onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="What's your reason for canceling?"
                />
              </div>
            )}

            {/* Retention Offer */}
            {feedback.reason === 'too_expensive' && (
              <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Wait! We have an offer for you
                </h3>
                <p className="text-green-800 mb-4">
                  Get 30% off your next 3 months if you stay subscribed
                </p>
                <button
                  onClick={onKeepSubscription}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Claim Discount
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Feedback */}
        {currentStep === 'feedback' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Help us improve AdStack
            </h2>

            <div className="space-y-8">
              {/* Features Used */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Which features did you find most valuable?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {features.map((feature) => (
                    <label
                      key={feature}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        feedback.features.includes(feature)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={feedback.features.includes(feature)}
                        onChange={() => toggleFeature(feature)}
                        className="mr-3 w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-900">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Pricing Feedback */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How would you rate our pricing?
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'too_expensive', label: 'Too Expensive' },
                    { value: 'fair', label: 'Fair' },
                    { value: 'too_cheap', label: 'Great Value' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setFeedback({
                          ...feedback,
                          pricing: option.value as 'too_expensive' | 'fair' | 'too_cheap',
                        })
                      }
                      className={`flex-1 py-2 px-4 border-2 rounded-lg font-medium transition-colors ${
                        feedback.pricing === option.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Would you recommend AdStack to others?
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFeedback({ ...feedback, wouldRecommend: true })}
                    className={`flex-1 py-3 px-4 border-2 rounded-lg font-medium transition-colors ${
                      feedback.wouldRecommend
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setFeedback({ ...feedback, wouldRecommend: false })}
                    className={`flex-1 py-3 px-4 border-2 rounded-lg font-medium transition-colors ${
                      !feedback.wouldRecommend
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Additional Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Any additional feedback? (Optional)
                </label>
                <textarea
                  value={feedback.comments}
                  onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Tell us how we can improve..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 'confirmation' && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex p-4 rounded-full bg-red-100 mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Cancellation</h2>
              <p className="text-gray-600">Please review the details before confirming</p>
            </div>

            {/* Subscription Details */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Subscription Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Plan</span>
                  <span className="font-semibold text-gray-900">{subscription.plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing</span>
                  <span className="font-semibold text-gray-900 capitalize">
                    {subscription.billingInterval}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold text-gray-900">
                    $
                    {subscription.billingInterval === 'monthly'
                      ? subscription.plan.price.monthly
                      : subscription.plan.price.yearly}
                    /{subscription.billingInterval === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
              </div>
            </div>

            {/* What Happens Next */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-3">What happens next?</h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Your subscription will remain active until{' '}
                    <strong>{formatDate(subscription.renewalDate)}</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>You'll continue to have access to all {subscription.plan.name} features until then</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>No refunds will be issued for the current billing period</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>You can reactivate your subscription at any time</span>
                </li>
              </ul>
            </div>

            {/* Data Retention */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Your data is safe</h3>
              <p className="text-sm text-blue-800">
                We'll keep your data for 90 days after cancellation. You can export your data at any
                time before then.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 'complete' && (
          <div className="text-center py-12">
            <div className="inline-flex p-4 rounded-full bg-green-100 mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Subscription Canceled</h2>
            <p className="text-gray-600 mb-2">
              Your subscription has been scheduled for cancellation
            </p>
            <p className="text-gray-600 mb-8">
              You'll have access to your account until{' '}
              <strong>{formatDate(subscription.renewalDate)}</strong>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-blue-900 mb-2">Thank you for your feedback</h3>
              <p className="text-sm text-blue-800">
                We appreciate you taking the time to help us improve AdStack
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onKeepSubscription}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Reactivate Subscription
              </button>
              <button className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                Export My Data
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep !== 'complete' && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={currentStep === 'reason' ? onKeepSubscription : handleBack}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              {currentStep === 'reason' ? 'Keep Subscription' : 'Back'}
            </button>
            <button
              onClick={currentStep === 'confirmation' ? handleCancel : handleNext}
              disabled={loading || (currentStep === 'reason' && !feedback.reason)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </span>
              ) : currentStep === 'confirmation' ? (
                'Confirm Cancellation'
              ) : (
                'Continue'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
