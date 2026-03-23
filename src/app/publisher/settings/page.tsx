'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Globe, Bell, Shield } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { truncateAddress } from '@/lib/display-utils';
import { CURRENT_NETWORK } from '@/lib/stacks-config';
import { CopyButton } from '@/components/ui';

export default function PublisherSettingsPage() {
  const { isConnected, address } = useWalletStore();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [minCPM, setMinCPM] = useState('0.001');

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600">
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
        <Link
          href="/publisher"
          className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Publisher Settings</h1>

        {/* Account Section */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Account</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Address
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-mono text-gray-700 flex-1">
                  {truncateAddress(address, 12, 8)}
                </span>
                <CopyButton text={address} label="Copy" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Network
              </label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700 capitalize">{CURRENT_NETWORK}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Website Section */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Website</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="website-url" className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <input
                id="website-url"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://your-website.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your website where ads will be displayed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      categories.includes(cat)
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select categories relevant to your audience for better ad matching
              </p>
            </div>

            <div>
              <label htmlFor="min-cpm" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum CPM (STX)
              </label>
              <input
                id="min-cpm"
                type="number"
                step="0.001"
                min="0"
                value={minCPM}
                onChange={(e) => setMinCPM(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Only show ads that pay at least this amount per 1,000 views
              </p>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-700">Payout Notifications</p>
              <p className="text-xs text-gray-500">
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
                  notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
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
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
        <p className="text-xs text-gray-500 text-center mt-3">
          Settings will be stored on-chain via the user-profiles contract once deployed
        </p>
      </div>
    </div>
  );
}
