'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  XCircle,
  Info,
  X,
  TrendingUp,
  CreditCard,
  Calendar,
} from 'lucide-react';
import type { PaymentAlert } from './types';

interface PaymentAlertsProps {
  onDismiss?: (alertId: string) => void;
  onAction?: (alert: PaymentAlert) => void;
}

export function PaymentAlerts({ onDismiss, onAction }: PaymentAlertsProps) {
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      // TODO: Fetch alerts from API
      // Placeholder data
      setAlerts([
        {
          id: 'alert_1',
          type: 'failed_payment',
          severity: 'error',
          title: 'Payment Failed',
          message:
            'Your payment for $149.00 failed. Please update your payment method to avoid service interruption.',
          date: new Date('2024-02-08'),
          actionLabel: 'Update Payment Method',
          actionUrl: '/settings/payment',
          dismissed: false,
        },
        {
          id: 'alert_2',
          type: 'upcoming_renewal',
          severity: 'info',
          title: 'Upcoming Renewal',
          message: 'Your Pro plan will renew in 5 days for $149.00.',
          date: new Date('2024-02-07'),
          actionLabel: 'Manage Subscription',
          actionUrl: '/settings/subscription',
          dismissed: false,
        },
        {
          id: 'alert_3',
          type: 'usage_limit',
          severity: 'warning',
          title: 'Approaching Usage Limit',
          message:
            "You've used 92% of your API calls this month. Consider upgrading to avoid hitting limits.",
          date: new Date('2024-02-06'),
          actionLabel: 'View Usage',
          actionUrl: '/settings/usage',
          dismissed: false,
        },
        {
          id: 'alert_4',
          type: 'trial_ending',
          severity: 'warning',
          title: 'Trial Ending Soon',
          message: 'Your 14-day trial ends in 3 days. Add a payment method to continue using AdStack.',
          date: new Date('2024-02-05'),
          actionLabel: 'Add Payment Method',
          actionUrl: '/settings/payment',
          dismissed: false,
        },
      ]);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, dismissed: true } : alert))
    );
    onDismiss?.(alertId);
  };

  const getAlertIcon = (type: PaymentAlert['type']) => {
    switch (type) {
      case 'failed_payment':
        return XCircle;
      case 'upcoming_renewal':
        return Calendar;
      case 'usage_limit':
        return TrendingUp;
      case 'trial_ending':
        return Clock;
      default:
        return Info;
    }
  };

  const getAlertStyles = (severity: PaymentAlert['severity']) => {
    switch (severity) {
      case 'error':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          title: 'text-red-900',
          message: 'text-red-800',
          button: 'bg-red-600 hover:bg-red-700 text-white',
          dismissButton: 'text-red-400 hover:text-red-600',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          message: 'text-yellow-800',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          dismissButton: 'text-yellow-400 hover:text-yellow-600',
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          message: 'text-blue-800',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          dismissButton: 'text-blue-400 hover:text-blue-600',
        };
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const visibleAlerts = alerts.filter((alert) => !alert.dismissed);
  const criticalAlerts = visibleAlerts.filter((alert) => alert.severity === 'error');
  const warningAlerts = visibleAlerts.filter((alert) => alert.severity === 'warning');
  const infoAlerts = visibleAlerts.filter((alert) => alert.severity === 'info');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Alerts</h1>
        <p className="text-gray-600">Stay informed about your billing and usage</p>
      </div>

      {/* Summary */}
      {visibleAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Critical</p>
                <p className="text-2xl font-bold text-red-900">{criticalAlerts.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-900">{warningAlerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Info</p>
                <p className="text-2xl font-bold text-blue-900">{infoAlerts.length}</p>
              </div>
              <Info className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {visibleAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h3>
            <p className="text-gray-600">You don't have any active alerts</p>
          </div>
        ) : (
          visibleAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            const styles = getAlertStyles(alert.severity);

            return (
              <div
                key={alert.id}
                className={`border rounded-lg p-6 ${styles.container} transition-all hover:shadow-md`}
              >
                <div className="flex items-start">
                  <div className={`p-2 rounded-lg bg-white mr-4 flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${styles.icon}`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`text-lg font-semibold ${styles.title}`}>{alert.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(alert.date)}</p>
                      </div>
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className={`p-1 rounded hover:bg-white transition-colors ${styles.dismissButton}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className={`${styles.message} mb-4`}>{alert.message}</p>

                    {alert.actionLabel && (
                      <button
                        onClick={() => onAction?.(alert)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${styles.button}`}
                      >
                        {alert.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Notification Settings */}
      {visibleAlerts.length > 0 && (
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Settings</h3>
              <p className="text-sm text-gray-600">
                Manage how and when you receive payment and billing notifications
              </p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm whitespace-nowrap">
              Configure →
            </button>
          </div>
        </div>
      )}

      {/* Dismiss All */}
      {visibleAlerts.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => visibleAlerts.forEach((alert) => handleDismiss(alert.id))}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Dismiss All Alerts
          </button>
        </div>
      )}
    </div>
  );
}
