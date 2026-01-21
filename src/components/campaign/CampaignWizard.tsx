'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/store/wallet-store';
import { createCampaign, CampaignState } from '@/lib/contracts/campaign-lifecycle';
import { getStacksNetwork } from '@/lib/stacks-config';

interface CampaignFormData {
  name: string;
  description: string;
  budget: string;
  fundingThreshold: string;
  startDate: string;
  endDate: string;
  targetAudience: string;
  objectives: string[];
  channels: string[];
}

enum WizardStep {
  BASIC_INFO = 0,
  BUDGET_TIMELINE = 1,
  TARGETING = 2,
  OBJECTIVES = 3,
  REVIEW = 4
}

const OBJECTIVE_OPTIONS = [
  'Brand Awareness',
  'Lead Generation',
  'Conversions',
  'Traffic',
  'Engagement'
];

const CHANNEL_OPTIONS = [
  'Display Ads',
  'Social Media',
  'Search Ads',
  'Video Ads',
  'Native Ads',
  'Email Marketing'
];

export default function CampaignWizard() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.BASIC_INFO);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    budget: '',
    fundingThreshold: '',
    startDate: '',
    endDate: '',
    targetAudience: '',
    objectives: [],
    channels: []
  });

  const updateFormData = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'objectives' | 'channels', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleNext = () => {
    if (currentStep < WizardStep.REVIEW) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > WizardStep.BASIC_INFO) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    try {
      const budgetMicroStx = BigInt(Math.floor(parseFloat(formData.budget) * 1_000_000));
      const thresholdMicroStx = BigInt(Math.floor(parseFloat(formData.fundingThreshold) * 1_000_000));
      const startTime = Math.floor(new Date(formData.startDate).getTime() / 1000);
      const endTime = Math.floor(new Date(formData.endDate).getTime() / 1000);

      const metadata = JSON.stringify({
        description: formData.description,
        targetAudience: formData.targetAudience,
        objectives: formData.objectives,
        channels: formData.channels
      });

      await createCampaign({
        name: formData.name,
        budget: budgetMicroStx,
        fundingThreshold: thresholdMicroStx,
        startTime,
        endTime,
        metadata,
        network: getStacksNetwork(),
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
        onFinish: (data) => {
          console.log('Campaign created:', data);
          router.push('/campaigns');
        },
        onCancel: () => {
          console.log('Campaign creation cancelled');
          setIsSubmitting(false);
        }
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
      setIsSubmitting(false);
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case WizardStep.BASIC_INFO:
        return formData.name.length > 0 && formData.description.length > 0;
      case WizardStep.BUDGET_TIMELINE:
        return (
          parseFloat(formData.budget) > 0 &&
          parseFloat(formData.fundingThreshold) > 0 &&
          parseFloat(formData.fundingThreshold) <= parseFloat(formData.budget) &&
          formData.startDate.length > 0 &&
          formData.endDate.length > 0 &&
          new Date(formData.endDate) > new Date(formData.startDate)
        );
      case WizardStep.TARGETING:
        return formData.targetAudience.length > 0;
      case WizardStep.OBJECTIVES:
        return formData.objectives.length > 0 && formData.channels.length > 0;
      default:
        return true;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Object.values(WizardStep).filter(v => typeof v === 'number').map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              currentStep >= step
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {(step as number) + 1}
          </div>
          {(step as number) < WizardStep.REVIEW && (
            <div
              className={`w-16 h-1 ${
                currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Basic Information</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Campaign Name*</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Enter campaign name"
          maxLength={64}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description*</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your campaign"
          rows={4}
          maxLength={500}
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.description.length}/500 characters
        </p>
      </div>
    </div>
  );

  const renderBudgetTimeline = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Budget & Timeline</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Total Budget (STX)*</label>
          <input
            type="number"
            value={formData.budget}
            onChange={(e) => updateFormData('budget', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Funding Threshold (STX)*</label>
          <input
            type="number"
            value={formData.fundingThreshold}
            onChange={(e) => updateFormData('fundingThreshold', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <p className="text-sm text-gray-500 mt-1">
            Minimum amount needed to activate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Start Date*</label>
          <input
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => updateFormData('startDate', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">End Date*</label>
          <input
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => updateFormData('endDate', e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderTargeting = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Target Audience</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Audience Description*</label>
        <textarea
          value={formData.targetAudience}
          onChange={(e) => updateFormData('targetAudience', e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your target audience (demographics, interests, behaviors)"
          rows={6}
          maxLength={500}
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.targetAudience.length}/500 characters
        </p>
      </div>
    </div>
  );

  const renderObjectives = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Campaign Objectives & Channels</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Campaign Objectives*</label>
        <div className="grid grid-cols-2 gap-3">
          {OBJECTIVE_OPTIONS.map((objective) => (
            <button
              key={objective}
              onClick={() => toggleArrayItem('objectives', objective)}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                formData.objectives.includes(objective)
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {objective}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Advertising Channels*</label>
        <div className="grid grid-cols-2 gap-3">
          {CHANNEL_OPTIONS.map((channel) => (
            <button
              key={channel}
              onClick={() => toggleArrayItem('channels', channel)}
              className={`px-4 py-3 rounded-lg border-2 transition-all ${
                formData.channels.includes(channel)
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {channel}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review Campaign</h2>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">Basic Information</h3>
          <p className="text-gray-700"><strong>Name:</strong> {formData.name}</p>
          <p className="text-gray-700"><strong>Description:</strong> {formData.description}</p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Budget & Timeline</h3>
          <p className="text-gray-700"><strong>Budget:</strong> {formData.budget} STX</p>
          <p className="text-gray-700"><strong>Threshold:</strong> {formData.fundingThreshold} STX</p>
          <p className="text-gray-700"><strong>Start:</strong> {new Date(formData.startDate).toLocaleString()}</p>
          <p className="text-gray-700"><strong>End:</strong> {new Date(formData.endDate).toLocaleString()}</p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Targeting</h3>
          <p className="text-gray-700">{formData.targetAudience}</p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Objectives</h3>
          <p className="text-gray-700">{formData.objectives.join(', ')}</p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Channels</h3>
          <p className="text-gray-700">{formData.channels.join(', ')}</p>
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case WizardStep.BASIC_INFO:
        return renderBasicInfo();
      case WizardStep.BUDGET_TIMELINE:
        return renderBudgetTimeline();
      case WizardStep.TARGETING:
        return renderTargeting();
      case WizardStep.OBJECTIVES:
        return renderObjectives();
      case WizardStep.REVIEW:
        return renderReview();
      default:
        return null;
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">Please connect your wallet to create a campaign</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {renderStepIndicator()}
        {renderStep()}

        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === WizardStep.BASIC_INFO}
            className="px-6 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Back
          </button>

          {currentStep < WizardStep.REVIEW ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
