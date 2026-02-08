'use client';

import { useState } from 'react';
import { Calendar, Bell, BellOff, Clock, CheckCircle2, Settings } from 'lucide-react';
import type { CurrentSubscription } from './types';

interface RenewalRemindersProps {
  subscription: CurrentSubscription;
  onToggleAutoRenew?: (enabled: boolean) => void;
  onUpdateReminders?: (settings: ReminderSettings) => void;
}

interface ReminderSettings {
  enabled: boolean;
  daysBeforeRenewal: number[];
  emailEnabled: boolean;
  pushEnabled: boolean;
}

export function RenewalReminders({
  subscription,
  onToggleAutoRenew,
  onUpdateReminders,
}: RenewalRemindersProps) {
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: true,
    daysBeforeRenewal: [7, 3, 1],
    emailEnabled: true,
    pushEnabled: true,
  });

  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilRenewal = () => {
    const now = new Date();
    const renewal = new Date(subscription.renewalDate);
    const diff = renewal.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleToggleReminders = async (enabled: boolean) => {
    try {
      setSaving(true);
      setSettings({ ...settings, enabled });
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update reminder settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    try {
      setSaving(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onToggleAutoRenew?.(!subscription.autoRenew);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to toggle auto-renewal:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onUpdateReminders?.(settings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save reminder settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    setSettings((prev) => ({
      ...prev,
      daysBeforeRenewal: prev.daysBeforeRenewal.includes(day)
        ? prev.daysBeforeRenewal.filter((d) => d !== day)
        : [...prev.daysBeforeRenewal, day].sort((a, b) => b - a),
    }));
  };

  const daysUntilRenewal = getDaysUntilRenewal();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Renewal Settings</h1>
        <p className="text-gray-600">Manage your subscription renewal and notification preferences</p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
          <p className="text-green-800">Settings updated successfully</p>
        </div>
      )}

      {/* Next Renewal Info */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Next Renewal</h2>
            <p className="text-blue-100 mb-4">{formatDate(subscription.renewalDate)}</p>
            <div className="flex items-center space-x-6">
              <div>
                <p className="text-blue-100 text-sm">Days Until Renewal</p>
                <p className="text-3xl font-bold">{daysUntilRenewal}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Renewal Amount</p>
                <p className="text-3xl font-bold">
                  $
                  {subscription.billingInterval === 'monthly'
                    ? subscription.plan.price.monthly
                    : subscription.plan.price.yearly}
                </p>
              </div>
            </div>
          </div>
          <Calendar className="w-16 h-16 text-blue-200" />
        </div>
      </div>

      {/* Auto-Renewal Toggle */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Auto-Renewal</h2>
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Automatic Subscription Renewal
                </h3>
                {subscription.autoRenew ? (
                  <span className="ml-3 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                    ENABLED
                  </span>
                ) : (
                  <span className="ml-3 bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded">
                    DISABLED
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4">
                {subscription.autoRenew
                  ? 'Your subscription will automatically renew on the renewal date'
                  : 'Your subscription will end on the renewal date unless manually renewed'}
              </p>

              <button
                onClick={handleToggleAutoRenew}
                disabled={saving}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  subscription.autoRenew
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saving ? 'Updating...' : subscription.autoRenew ? 'Disable Auto-Renewal' : 'Enable Auto-Renewal'}
              </button>
            </div>
          </div>

          {!subscription.autoRenew && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Your subscription will end on {formatDate(subscription.renewalDate)}.
                You can manually renew before then to maintain access.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reminder Settings */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Renewal Reminders</h2>
            <button
              onClick={() => handleToggleReminders(!settings.enabled)}
              disabled={saving}
              className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              {settings.enabled ? (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Enabled
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 mr-2" />
                  Disabled
                </>
              )}
            </button>
          </div>
        </div>
        <div className="p-6">
          {settings.enabled ? (
            <div className="space-y-6">
              {/* Reminder Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Send reminders before renewal
                </label>
                <div className="flex flex-wrap gap-3">
                  {[14, 7, 3, 1].map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${
                        settings.daysBeforeRenewal.includes(day)
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {day} {day === 1 ? 'day' : 'days'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Channels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Notification channels
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={settings.emailEnabled}
                      onChange={(e) =>
                        setSettings({ ...settings, emailEnabled: e.target.checked })
                      }
                      className="mr-3 w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">
                        Receive renewal reminders via email
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                    <input
                      type="checkbox"
                      checked={settings.pushEnabled}
                      onChange={(e) =>
                        setSettings({ ...settings, pushEnabled: e.target.checked })
                      }
                      className="mr-3 w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Push Notifications</p>
                      <p className="text-sm text-gray-600">
                        Receive renewal reminders as push notifications
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Upcoming Reminders */}
              {subscription.autoRenew && settings.daysBeforeRenewal.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Upcoming Reminders
                  </h4>
                  <div className="space-y-2">
                    {settings.daysBeforeRenewal
                      .filter((day) => day <= daysUntilRenewal)
                      .map((day) => {
                        const reminderDate = new Date(subscription.renewalDate);
                        reminderDate.setDate(reminderDate.getDate() - day);
                        return (
                          <div key={day} className="text-sm text-blue-800 flex items-center">
                            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                            {formatDate(reminderDate)} ({day} {day === 1 ? 'day' : 'days'} before renewal)
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Reminder Settings'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Renewal reminders are disabled</p>
              <button
                onClick={() => handleToggleReminders(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Enable Reminders
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-start">
          <Settings className="w-6 h-6 text-gray-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Renewal Information</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Your payment method will be charged automatically if auto-renewal is enabled</li>
              <li>• You can change or cancel your subscription at any time before renewal</li>
              <li>• Reminders will be sent to your registered email address</li>
              <li>• You can update your notification preferences anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
