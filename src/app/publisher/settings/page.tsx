'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Save, Globe, Bell, Shield } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { truncateAddress } from '@/lib/display-utils';
import { CURRENT_NETWORK } from '@/lib/stacks-config';
import { CopyButton, Breadcrumb } from '@/components/ui';
import { useToastStore } from '@/store/toast-store';

export default function PublisherSettingsPage() {
  const { isConnected, address } = useWalletStore();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [minCPM, setMinCPM] = useState('0.001');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const validate = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (websiteUrl && !/^https?:\/\/.+\..+/.test(websiteUrl)) {
      errs.websiteUrl = 'Enter a valid URL starting with http:// or https://';
    }
    const cpm = parseFloat(minCPM);
    if (isNaN(cpm) || cpm < 0) {
      errs.minCPM = 'Minimum CPM must be a positive number';
    }
    if (cpm > 1000) {
      errs.minCPM = 'Minimum CPM cannot exceed 1,000 STX';
    }
    return errs;
  }, [websiteUrl, minCPM]);

  const handleSave = useCallback(() => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    // Store locally until on-chain storage is available
    try {
      localStorage.setItem(
        `adstack_publisher_${address}`,
        JSON.stringify({ websiteUrl, categories, notificationsEnabled, minCPM }),
      );
      addToast({ type: 'success', title: 'Settings Saved', message: 'Your preferences have been saved locally.' });
    } catch {
      addToast({ type: 'error', title: 'Save Failed', message: 'Could not persist settings.' });
    } finally {
      setSaving(false);
    }
  }, [validate, address, websiteUrl, categories, notificationsEnabled, minCPM, addToast]);

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your Stacks wallet to manage publisher settings.
          </p>
        </div>
      </div>
    );
  }

  const availableCategories = [
    'Technology',
    'Finance',
    'Gaming',
    'Education',
    'NFTs',
    'DeFi',
    'News',
    'Entertainment',
  ];

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Breadcrumb
          items={[
            { label: 'Publisher', href: '/publisher' },
            { label: 'Settings' },
          ]}
          className="mb-6"
        />

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Publisher Settings</h1>

        {/* Account Section */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Account</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wallet Address
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300 flex-1">
                  {truncateAddress(address, 12, 8)}
                </span>
                <CopyButton text={address} label="Copy" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Network
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{CURRENT_NETWORK}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Website Section */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Website</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="website-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website URL
              </label>
              <input
                id="website-url"
                type="url"
                value={websiteUrl}
                onChange={(e) => { setWebsiteUrl(e.target.value); setErrors((prev) => { const { websiteUrl: _, ...rest } = prev; return rest; }); }}
                placeholder="https://your-website.com"
                aria-invalid={!!errors.websiteUrl}
                aria-describedby={errors.websiteUrl ? 'website-url-error' : undefined}
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.websiteUrl ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
              />
              {errors.websiteUrl ? (
                <p id="website-url-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">{errors.websiteUrl}</p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your website where ads will be displayed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      categories.includes(cat)
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Select categories relevant to your audience for better ad matching
              </p>
            </div>

            <div>
              <label htmlFor="min-cpm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum CPM (STX)
              </label>
              <input
                id="min-cpm"
                type="number"
                step="0.001"
                min="0"
                value={minCPM}
                onChange={(e) => { setMinCPM(e.target.value); setErrors((prev) => { const { minCPM: _, ...rest } = prev; return rest; }); }}
                aria-invalid={!!errors.minCPM}
                aria-describedby={errors.minCPM ? 'min-cpm-error' : undefined}
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.minCPM ? 'border-red-400 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
              />
              {errors.minCPM ? (
                <p id="min-cpm-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">{errors.minCPM}</p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Only show ads that pay at least this amount per 1,000 views</p>
              )}
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Payout Notifications</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Get notified when a payout is processed
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-10 h-6 rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-1 ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </div>
            </div>
          </label>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
          Settings are saved locally until on-chain storage is deployed
        </p>
      </div>
    </div>
  );
}
