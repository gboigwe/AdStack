'use client';

import { useState } from 'react';
import { Target, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import {
  CRITERIA_TYPES,
  DEVICE_TYPES,
  type AudienceSegment,
  type TargetingRule,
} from './types';

interface TargetingCriteria {
  criteriaType: number;
  minValue: number;
  maxValue: number;
  weight: number;
  values: string[];
}

interface TargetingRuleBuilderProps {
  campaignId?: number;
  existingSegments?: AudienceSegment[];
  onSave?: (rules: TargetingCriteria[]) => void;
}

export function TargetingRuleBuilder({
  campaignId,
  existingSegments = [],
  onSave,
}: TargetingRuleBuilderProps) {
  const [criteria, setCriteria] = useState<TargetingCriteria[]>([]);
  const [segmentName, setSegmentName] = useState('');
  const [segmentDescription, setSegmentDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addCriteria = () => {
    setCriteria([
      ...criteria,
      {
        criteriaType: 1,
        minValue: 0,
        maxValue: 100,
        weight: 50,
        values: [],
      },
    ]);
  };

  const removeCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const updateCriteria = (index: number, field: keyof TargetingCriteria, value: number | string[]) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const handleSave = async () => {
    if (!segmentName.trim()) {
      setError('Segment name is required');
      return;
    }
    if (criteria.length === 0) {
      setError('Add at least one targeting criteria');
      return;
    }
    setError('');
    setSaving(true);
    try {
      onSave?.(criteria);
    } finally {
      setSaving(false);
    }
  };

  const getEstimatedReach = () => {
    let base = 100;
    criteria.forEach((c) => {
      const range = c.maxValue - c.minValue;
      const coverage = range / 100;
      base = Math.floor(base * coverage);
    });
    return Math.max(base, 1);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Targeting Rule Builder</h2>
            <p className="text-sm text-gray-500">Define audience targeting criteria for your campaign</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Rules'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Segment Name</label>
          <input
            type="text"
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            placeholder="e.g., Tech-savvy millennials"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={segmentDescription}
            onChange={(e) => setSegmentDescription(e.target.value)}
            placeholder="Brief description of this segment"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Targeting Criteria</h3>
          <button
            onClick={addCriteria}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Criteria
          </button>
        </div>

        {criteria.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No targeting criteria defined yet</p>
            <button
              onClick={addCriteria}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Add your first criteria
            </button>
          </div>
        )}

        <div className="space-y-3">
          {criteria.map((c, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                    <select
                      value={c.criteriaType}
                      onChange={(e) => updateCriteria(index, 'criteriaType', parseInt(e.target.value))}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      {Object.entries(CRITERIA_TYPES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Min Value</label>
                    <input
                      type="number"
                      value={c.minValue}
                      onChange={(e) => updateCriteria(index, 'minValue', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Max Value</label>
                    <input
                      type="number"
                      value={c.maxValue}
                      onChange={(e) => updateCriteria(index, 'maxValue', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Weight ({c.weight}%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={c.weight}
                      onChange={(e) => updateCriteria(index, 'weight', parseInt(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeCriteria(index)}
                  className="ml-3 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {c.criteriaType === 5 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(DEVICE_TYPES).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" className="rounded" />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{criteria.length}</span> criteria defined
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Estimated reach:</span>
          <span className="font-semibold text-blue-600">{getEstimatedReach()}%</span>
        </div>
      </div>
    </div>
  );
}
