'use client';

import { useState, useCallback } from 'react';
import { FileText, AlertTriangle, DollarSign, Send } from 'lucide-react';
import {
  DISPUTE_TYPES,
  SEVERITY_LEVELS,
  type DisputeCase,
} from './types';

interface DisputeFilingFormProps {
  campaignId?: number;
  onSubmit?: (data: {
    respondent: string;
    campaignId: number;
    disputeType: number;
    severity: number;
    amount: number;
    description: string;
    tags: string[];
  }) => void;
}

export function DisputeFilingForm({ campaignId, onSubmit }: DisputeFilingFormProps) {
  const [respondent, setRespondent] = useState('');
  const [campaign, setCampaign] = useState(campaignId?.toString() || '');
  const [disputeType, setDisputeType] = useState(1);
  const [severity, setSeverity] = useState(2);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && tags.length < 5 && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = useCallback(() => {
    if (!respondent || !campaign || !description || !amount) return;
    setSubmitting(true);
    onSubmit?.({
      respondent,
      campaignId: parseInt(campaign),
      disputeType,
      severity,
      amount: parseInt(amount),
      description,
      tags,
    });
    setSubmitting(false);
  }, [respondent, campaign, disputeType, severity, amount, description, tags, onSubmit]);

  const severityColor = (sev: number) => {
    if (sev === 4) return 'text-red-700 bg-red-50 border-red-200';
    if (sev === 3) return 'text-orange-700 bg-orange-50 border-orange-200';
    if (sev === 2) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-blue-700 bg-blue-50 border-blue-200';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-50 rounded-lg">
          <FileText className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">File a Dispute</h3>
          <p className="text-sm text-gray-500">Submit a formal dispute case for resolution</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Respondent Address
          </label>
          <input
            type="text"
            value={respondent}
            onChange={(e) => setRespondent(e.target.value)}
            placeholder="SP..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign ID
            </label>
            <input
              type="number"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount at Stake (uSTX)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000000"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dispute Type
            </label>
            <select
              value={disputeType}
              onChange={(e) => setDisputeType(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {Object.entries(DISPUTE_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              {Object.entries(SEVERITY_LEVELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${severityColor(severity)}`}>
          <AlertTriangle className="w-4 h-4" />
          {SEVERITY_LEVELS[severity]} Severity
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Describe the dispute in detail..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{description.length}/500</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Tags (max 5)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tag..."
              maxLength={30}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <button
              onClick={addTag}
              disabled={tags.length >= 5}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-gray-600">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !respondent || !campaign || !description || !amount}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting...' : 'File Dispute'}
        </button>
      </div>
    </div>
  );
}
