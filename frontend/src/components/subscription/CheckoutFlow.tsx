'use client';

import { useState } from 'react';
import { Check, CreditCard, FileText, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import type { SubscriptionPlan, BillingInterval, CheckoutData } from './types';

interface CheckoutFlowProps {
  selectedPlan?: SubscriptionPlan;
  billingInterval?: BillingInterval;
  onComplete?: (data: CheckoutData) => void;
  onCancel?: () => void;
}

type CheckoutStep = 'plan' | 'payment' | 'review' | 'confirmation';

export function CheckoutFlow({
  selectedPlan,
  billingInterval = 'monthly',
  onComplete,
  onCancel,
}: CheckoutFlowProps) {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('plan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [checkoutData, setCheckoutData] = useState<Partial<CheckoutData>>({
    plan: selectedPlan,
    billingInterval,
    billingDetails: {
      name: '',
      email: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
      },
    },
    agreedToTerms: false,
  });

  const steps = [
    { id: 'plan', label: 'Select Plan', icon: FileText },
    { id: 'payment', label: 'Payment Details', icon: CreditCard },
    { id: 'review', label: 'Review Order', icon: Check },
    { id: 'confirmation', label: 'Confirmation', icon: CheckCircle2 },
  ];

  const getStepIndex = (step: CheckoutStep) => steps.findIndex((s) => s.id === step);

  const handleNext = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as CheckoutStep);
    }
  };

  const handleBack = () => {
    const currentIndex = getStepIndex(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as CheckoutStep);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate data
      if (!checkoutData.plan) {
        throw new Error('Please select a plan');
      }

      if (!checkoutData.billingDetails?.name || !checkoutData.billingDetails?.email) {
        throw new Error('Please fill in billing details');
      }

      if (!checkoutData.agreedToTerms) {
        throw new Error('Please agree to terms and conditions');
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setCurrentStep('confirmation');
      onComplete?.(checkoutData as CheckoutData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateBillingDetails = (field: string, value: any) => {
    setCheckoutData((prev) => ({
      ...prev,
      billingDetails: {
        ...prev.billingDetails!,
        [field]: value,
      },
    }));
  };

  const updateAddress = (field: string, value: string) => {
    setCheckoutData((prev) => ({
      ...prev,
      billingDetails: {
        ...prev.billingDetails!,
        address: {
          ...prev.billingDetails!.address,
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Progress Steps */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = getStepIndex(currentStep) > index;

            return (
              <div key={step.id} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-green-600 text-white'
                        : isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-6 left-1/2 w-full h-0.5 -z-10 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {currentStep === 'plan' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Your Plan</h2>
            {selectedPlan && (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedPlan.name}</h3>
                    <p className="text-gray-600 mt-1">{selectedPlan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">
                      ${billingInterval === 'monthly' ? selectedPlan.price.monthly : selectedPlan.price.yearly / 12}
                    </p>
                    <p className="text-gray-600">/month</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedPlan.features.slice(0, 5).map((feature, index) => (
                    <div key={index} className="flex items-center text-gray-700">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 'payment' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Details</h2>
            <div className="space-y-6">
              {/* Billing Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={checkoutData.billingDetails?.name || ''}
                  onChange={(e) => updateBillingDetails('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={checkoutData.billingDetails?.email || ''}
                  onChange={(e) => updateBillingDetails('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              {/* Card Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={checkoutData.billingDetails?.address.line1 || ''}
                  onChange={(e) => updateAddress('line1', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent mb-3"
                  placeholder="Street address"
                />
                <input
                  type="text"
                  value={checkoutData.billingDetails?.address.line2 || ''}
                  onChange={(e) => updateAddress('line2', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Apt, suite, etc. (optional)"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={checkoutData.billingDetails?.address.city || ''}
                    onChange={(e) => updateAddress('city', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={checkoutData.billingDetails?.address.state || ''}
                    onChange={(e) => updateAddress('state', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={checkoutData.billingDetails?.address.postalCode || ''}
                    onChange={(e) => updateAddress('postalCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Order</h2>
            <div className="space-y-6">
              {/* Plan Summary */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Subscription Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Plan</span>
                    <span className="font-semibold">{selectedPlan?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Billing</span>
                    <span className="font-semibold capitalize">{billingInterval}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">
                      ${billingInterval === 'monthly' ? selectedPlan?.price.monthly : selectedPlan?.price.yearly}
                      {billingInterval === 'monthly' ? '/month' : '/year'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billing Details */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Billing Information</h3>
                <div className="space-y-1 text-gray-700">
                  <p>{checkoutData.billingDetails?.name}</p>
                  <p>{checkoutData.billingDetails?.email}</p>
                  <p>{checkoutData.billingDetails?.address.line1}</p>
                  {checkoutData.billingDetails?.address.line2 && (
                    <p>{checkoutData.billingDetails.address.line2}</p>
                  )}
                  <p>
                    {checkoutData.billingDetails?.address.city}, {checkoutData.billingDetails?.address.state}{' '}
                    {checkoutData.billingDetails?.address.postalCode}
                  </p>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={checkoutData.agreedToTerms}
                  onChange={(e) =>
                    setCheckoutData((prev) => ({ ...prev, agreedToTerms: e.target.checked }))
                  }
                  className="mt-1 mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                />
                <label className="text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'confirmation' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Subscription Activated!</h2>
            <p className="text-gray-600 mb-8">
              Your subscription has been successfully activated. You can now access all features of your plan.
            </p>
            <button
              onClick={onCancel}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep !== 'confirmation' && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={currentStep === 'plan' ? onCancel : handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 'plan' ? 'Cancel' : 'Back'}
            </button>
            <button
              onClick={currentStep === 'review' ? handleSubmit : handleNext}
              disabled={loading}
              className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : currentStep === 'review' ? (
                'Complete Subscription'
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
