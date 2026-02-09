'use client';

import { useState } from 'react';
import { CreditCard, Plus, Trash2, Check, MoreVertical } from 'lucide-react';
import type { PaymentMethod } from './types';

interface PaymentMethodsProps {
  onAddPaymentMethod?: (method: PaymentMethod) => void;
  onRemovePaymentMethod?: (methodId: string) => void;
  onSetDefaultPaymentMethod?: (methodId: string) => void;
}

export function PaymentMethods({
  onAddPaymentMethod,
  onRemovePaymentMethod,
  onSetDefaultPaymentMethod,
}: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'pm_1',
      type: 'card',
      brand: 'visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
      billingDetails: {
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94102',
          country: 'US',
        },
      },
    },
    {
      id: 'pm_2',
      type: 'card',
      brand: 'mastercard',
      last4: '5555',
      expiryMonth: 8,
      expiryYear: 2024,
      isDefault: false,
      billingDetails: {
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94102',
          country: 'US',
        },
      },
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleSetDefault = async (methodId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setPaymentMethods((methods) =>
        methods.map((method) => ({
          ...method,
          isDefault: method.id === methodId,
        }))
      );

      onSetDefaultPaymentMethod?.(methodId);
      setMenuOpen(null);
    } catch (err) {
      setError('Failed to set default payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setPaymentMethods((methods) => methods.filter((method) => method.id !== methodId));
      onRemovePaymentMethod?.(methodId);
      setMenuOpen(null);
    } catch (err) {
      setError('Failed to remove payment method');
    } finally {
      setLoading(false);
    }
  };

  const getCardBrandIcon = (brand?: string) => {
    // In a real app, you'd use actual card brand logos
    return <CreditCard className="w-8 h-8" />;
  };

  const getCardBrandColor = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return 'bg-blue-100 text-blue-600';
      case 'mastercard':
        return 'bg-orange-100 text-orange-600';
      case 'amex':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Methods</h1>
          <p className="text-gray-600">Manage your payment methods and billing information</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Payment Method
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Add Payment Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Payment Method</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="setDefault"
                className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
              />
              <label htmlFor="setDefault" className="text-sm text-gray-700">
                Set as default payment method
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Payment Method'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods List */}
      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payment Methods</h3>
            <p className="text-gray-600 mb-6">Add a payment method to start using AdStack</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Add Payment Method
            </button>
          </div>
        ) : (
          paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`bg-white rounded-lg shadow p-6 transition-all ${
                method.isDefault ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${getCardBrandColor(method.brand)}`}>
                    {getCardBrandIcon(method.brand)}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {method.brand} •••• {method.last4}
                      </h3>
                      {method.isDefault && (
                        <span className="ml-3 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">
                      Expires {method.expiryMonth?.toString().padStart(2, '0')}/{method.expiryYear}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">{method.billingDetails.name}</p>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === method.id ? null : method.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>

                  {menuOpen === method.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      {!method.isDefault && (
                        <button
                          onClick={() => handleSetDefault(method.id)}
                          disabled={loading}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(method.id)}
                        disabled={loading || method.isDefault}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </button>
                      {method.isDefault && (
                        <p className="px-4 py-2 text-xs text-gray-500">
                          Cannot remove default method
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Security Note */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Secure:</strong> Your payment information is encrypted and securely stored. We never
          store your full card number.
        </p>
      </div>
    </div>
  );
}
