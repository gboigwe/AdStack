'use client';

import { useState } from 'react';
import { Users, Plus, Search, Filter, BarChart3, X } from 'lucide-react';
import { SEGMENT_TYPES, SEGMENT_STATUS, type AudienceSegment } from './types';

interface SegmentCreatorProps {
  onCreateSegment?: (segment: Partial<AudienceSegment>) => void;
}

const INTEREST_TAXONOMY = [
  'Technology', 'Finance', 'Health', 'Sports', 'Entertainment',
  'Travel', 'Food', 'Fashion', 'Education', 'Gaming',
  'Music', 'Art', 'Science', 'Politics', 'Business',
  'Real Estate', 'Automotive', 'Fitness', 'Photography', 'Crypto',
];

export function AudienceSegmentCreator({ onCreateSegment }: SegmentCreatorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [segmentType, setSegmentType] = useState(1);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(65);
  const [maxSize, setMaxSize] = useState(10000);
  const [similarityThreshold, setSimilarityThreshold] = useState(60);
  const [interestSearch, setInterestSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredInterests = INTEREST_TAXONOMY.filter(
    (i) => i.toLowerCase().includes(interestSearch.toLowerCase()) && !selectedInterests.includes(i)
  );

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else if (selectedInterests.length < 10) {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      onCreateSegment?.({
        name,
        description,
        minAge: ageMin,
        maxAge: ageMax,
        requiredInterests: selectedInterests,
        estimatedSize: maxSize,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-50 rounded-lg">
          <Users className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Audience Segment Creator</h2>
          <p className="text-sm text-gray-500">Build custom audience segments for targeted campaigns</p>
        </div>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Segment Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High-value crypto users"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Segment Type</label>
            <select
              value={segmentType}
              onChange={(e) => setSegmentType(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            >
              {Object.entries(SEGMENT_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Describe the audience this segment targets..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={ageMin}
              onChange={(e) => setAgeMin(parseInt(e.target.value) || 0)}
              min={13}
              max={100}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="number"
              value={ageMax}
              onChange={(e) => setAgeMax(parseInt(e.target.value) || 0)}
              min={13}
              max={100}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-xs text-gray-500">years old</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interests ({selectedInterests.length}/10)
          </label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={interestSearch}
              onChange={(e) => setInterestSearch(e.target.value)}
              placeholder="Search interests..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          {selectedInterests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedInterests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs"
                >
                  {interest}
                  <button onClick={() => toggleInterest(interest)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {filteredInterests.slice(0, 12).map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className="px-2.5 py-1 border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="Add a tag..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={addTag}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Segment Size</label>
            <input
              type="number"
              value={maxSize}
              onChange={(e) => setMaxSize(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Similarity Threshold ({similarityThreshold}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(parseInt(e.target.value))}
              className="w-full mt-2"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{selectedInterests.length} interests</span>
            <span>{tags.length} tags</span>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creating...' : 'Create Segment'}
          </button>
        </div>
      </div>
    </div>
  );
}
