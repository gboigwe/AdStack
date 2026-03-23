'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Rocket } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { stxToMicroStx, CONTRACTS, CONTRACT_ADDRESS } from '@/lib/stacks-config';
import { formatSTXWithSymbol } from '@/lib/display-utils';

interface CampaignFormData {
  name: string;
  budget: string;
  dailyBudget: string;
  durationDays: string;
  description: string;
}

const INITIAL_FORM: CampaignFormData = {
  name: '',
  budget: '',
  dailyBudget: '',
  durationDays: '30',
  description: '',
};

export default function NewCampaignPage() {
  const router = useRouter();
  const { isConnected, address } = useWalletStore();
  const [form, setForm] = useState<CampaignFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<CampaignFormData>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600">
            Please connect your Stacks wallet to create a campaign.
          </p>
        </div>
      </div>
    );
  }

  const validate = (): boolean => {
    const newErrors: Partial<CampaignFormData> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Campaign name is required';
    } else if (form.name.length > 64) {
      newErrors.name = 'Name must be 64 characters or less';
    }

    const budget = parseFloat(form.budget);
    if (!form.budget || isNaN(budget) || budget <= 0) {
      newErrors.budget = 'Enter a valid budget amount in STX';
    }

    const dailyBudget = parseFloat(form.dailyBudget);
    if (!form.dailyBudget || isNaN(dailyBudget) || dailyBudget <= 0) {
      newErrors.dailyBudget = 'Enter a valid daily budget in STX';
    } else if (budget && dailyBudget > budget) {
      newErrors.dailyBudget = 'Daily budget cannot exceed total budget';
    }

    const days = parseInt(form.durationDays, 10);
    if (!form.durationDays || isNaN(days) || days < 1 || days > 365) {
      newErrors.durationDays = 'Duration must be between 1 and 365 days';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name as keyof CampaignFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      // In a full implementation, this would call the promo-manager
      // contract's create-campaign function via Stacks Connect.
      // For now, we log the prepared transaction params.
      const budgetMicro = stxToMicroStx(parseFloat(form.budget));
      const dailyBudgetMicro = stxToMicroStx(parseFloat(form.dailyBudget));
      const durationBlocks = parseInt(form.durationDays, 10) * 144; // ~144 blocks/day

      console.log('Campaign creation params:', {
        contract: `${CONTRACT_ADDRESS}.${CONTRACTS.PROMO_MANAGER}`,
        function: 'create-campaign',
        args: {
          name: form.name,
          budget: budgetMicro.toString(),
          dailyBudget: dailyBudgetMicro.toString(),
          duration: durationBlocks,
          description: form.description,
        },
      });

      // Navigate back to dashboard after submission
      router.push('/advertiser');
    } catch (error) {
      console.error('Failed to create campaign:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const budgetPreview = form.budget && !isNaN(parseFloat(form.budget))
    ? formatSTXWithSymbol(stxToMicroStx(parseFloat(form.budget)), 2)
    : '0.00 STX';

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/advertiser"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Campaign</h1>
          <p className="text-gray-600 mt-2">
            Set up a new advertising campaign on the Stacks blockchain.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Q2 Brand Awareness"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                Total Budget (STX)
              </label>
              <input
                id="budget"
                name="budget"
                type="number"
                step="0.01"
                min="0"
                value={form.budget}
                onChange={handleChange}
                placeholder="100"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.budget ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.budget && (
                <p className="text-sm text-red-600 mt-1">{errors.budget}</p>
              )}
            </div>

            <div>
              <label htmlFor="dailyBudget" className="block text-sm font-medium text-gray-700 mb-1">
                Daily Budget (STX)
              </label>
              <input
                id="dailyBudget"
                name="dailyBudget"
                type="number"
                step="0.01"
                min="0"
                value={form.dailyBudget}
                onChange={handleChange}
                placeholder="10"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dailyBudget ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.dailyBudget && (
                <p className="text-sm text-red-600 mt-1">{errors.dailyBudget}</p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (days)
            </label>
            <input
              id="durationDays"
              name="durationDays"
              type="number"
              min="1"
              max="365"
              value={form.durationDays}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.durationDays ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.durationDays && (
              <p className="text-sm text-red-600 mt-1">{errors.durationDays}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your campaign goals and target audience..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Campaign Preview</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-blue-700">Total Budget:</span>
              <span className="text-blue-900 font-medium">{budgetPreview}</span>
              <span className="text-blue-700">Duration:</span>
              <span className="text-blue-900 font-medium">
                {form.durationDays || 0} days (~{(parseInt(form.durationDays, 10) || 0) * 144} blocks)
              </span>
              <span className="text-blue-700">Contract:</span>
              <span className="text-blue-900 font-mono text-xs">
                {CONTRACTS.PROMO_MANAGER}
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Rocket className="w-5 h-5" />
            )}
            {submitting ? 'Creating Campaign...' : 'Create Campaign'}
          </button>
        </form>
      </div>
    </div>
  );
}
