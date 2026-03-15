'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Rocket } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { stxToMicroStx, CONTRACTS, CONTRACT_ADDRESS, BLOCK_TIME } from '@/lib/stacks-config';
import { formatSTXWithSymbol } from '@/lib/display-utils';
import { buildCreateCampaign } from '@/lib/contract-calls';
import { useContractCall } from '@/hooks/use-contract-call';
import { Breadcrumb } from '@/components/ui';
import { FormInput, FormTextarea } from '@/components/forms';
import {
  validateCampaign,
  validateField,
  type CampaignFields,
  type CampaignErrors,
  MAX_DESCRIPTION_LENGTH,
} from '@/lib/campaign-validation';

const INITIAL_FORM: CampaignFields = {
  name: '',
  budget: '',
  dailyBudget: '',
  durationDays: '30',
  description: '',
};

export default function NewCampaignPage() {
  const router = useRouter();
  const { isConnected, address } = useWalletStore();
  const [form, setForm] = useState<CampaignFields>(INITIAL_FORM);
  const [errors, setErrors] = useState<CampaignErrors>({});

  const { execute, isLoading: submitting } = useContractCall({
    label: 'Create Campaign',
    invalidateKeys: [['read-only', CONTRACTS.PROMO_MANAGER]],
    onSuccess: () => {
      router.push('/advertiser');
    },
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please connect your Stacks wallet to create a campaign.
          </p>
        </div>
      </div>
    );
  }

  const validate = (): boolean => {
    const newErrors = validateCampaign(form);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name as keyof CampaignFields]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    const fieldError = validateField(name as keyof CampaignFields, value, form);
    if (fieldError) {
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !address) return;

    const budget = parseFloat(form.budget);
    const dailyBudget = parseFloat(form.dailyBudget);
    const durationSeconds =
      parseInt(form.durationDays, 10) * BLOCK_TIME.SECONDS_PER_DAY;

    const callArgs = buildCreateCampaign(address, {
      name: form.name,
      budget: BigInt(Math.floor(budget * 1_000_000)),
      dailyBudget: BigInt(Math.floor(dailyBudget * 1_000_000)),
      duration: durationSeconds,
      metadata: form.description || undefined,
    });

    execute(callArgs);
  };

  const budgetPreview = form.budget && !isNaN(parseFloat(form.budget))
    ? formatSTXWithSymbol(stxToMicroStx(parseFloat(form.budget)), 2)
    : '0.00 STX';

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/advertiser' },
              { label: 'Create Campaign' },
            ]}
            className="mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Campaign</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Set up a new advertising campaign on the Stacks blockchain.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <FormInput
            label="Campaign Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g. Q2 Brand Awareness"
            error={errors.name}
            required
          />

          {/* Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Total Budget (STX)"
              name="budget"
              type="number"
              step="0.01"
              min="0"
              value={form.budget}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="100"
              error={errors.budget}
              required
            />
            <FormInput
              label="Daily Budget (STX)"
              name="dailyBudget"
              type="number"
              step="0.01"
              min="0"
              value={form.dailyBudget}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="10"
              error={errors.dailyBudget}
              required
            />
          </div>

          {/* Duration */}
          <FormInput
            label="Duration (days)"
            name="durationDays"
            type="number"
            min="1"
            max="365"
            value={form.durationDays}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.durationDays}
            hint="Campaign runs for this many days on-chain"
            required
          />

          {/* Description */}
          <FormTextarea
            label="Description (optional)"
            name="description"
            rows={4}
            maxLength={MAX_DESCRIPTION_LENGTH}
            value={form.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Describe your campaign goals and target audience..."
            error={errors.description}
          />

          {/* Preview */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Campaign Preview</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-blue-700 dark:text-blue-400">Total Budget:</span>
              <span className="text-blue-900 dark:text-blue-200 font-medium">{budgetPreview}</span>
              <span className="text-blue-700 dark:text-blue-400">Duration:</span>
              <span className="text-blue-900 dark:text-blue-200 font-medium">
                {form.durationDays || 0} days (~{(parseInt(form.durationDays, 10) || 0) * 144} blocks)
              </span>
              <span className="text-blue-700 dark:text-blue-400">Contract:</span>
              <span className="text-blue-900 dark:text-blue-200 font-mono text-xs">
                {CONTRACTS.PROMO_MANAGER}
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
