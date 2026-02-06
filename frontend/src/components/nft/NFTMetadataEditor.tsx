'use client';

import { useState } from 'react';
import { Edit3, Save, X, Plus, Trash2 } from 'lucide-react';

interface NFTMetadata {
  name: string;
  description: string;
  category: string;
  tags: string[];
  attributes: Array<{ trait_type: string; value: string }>;
  externalUrl: string;
  backgroundColor: string;
}

interface NFTMetadataEditorProps {
  tokenId: number;
  initialMetadata?: Partial<NFTMetadata>;
  onSave?: (metadata: NFTMetadata) => void;
  onCancel?: () => void;
}

export function NFTMetadataEditor({
  tokenId,
  initialMetadata = {},
  onSave,
  onCancel,
}: NFTMetadataEditorProps) {
  const [metadata, setMetadata] = useState<NFTMetadata>({
    name: initialMetadata.name || '',
    description: initialMetadata.description || '',
    category: initialMetadata.category || '',
    tags: initialMetadata.tags || [],
    attributes: initialMetadata.attributes || [],
    externalUrl: initialMetadata.externalUrl || '',
    backgroundColor: initialMetadata.backgroundColor || '#ffffff',
  });

  const [newTag, setNewTag] = useState('');
  const [newAttribute, setNewAttribute] = useState({ trait_type: '', value: '' });
  const [isEditing, setIsEditing] = useState(false);

  const addTag = () => {
    if (newTag.trim() && metadata.tags.length < 10 && !metadata.tags.includes(newTag.trim())) {
      setMetadata({ ...metadata, tags: [...metadata.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setMetadata({
      ...metadata,
      tags: metadata.tags.filter((_, i) => i !== index),
    });
  };

  const addAttribute = () => {
    if (newAttribute.trait_type.trim() && newAttribute.value.trim()) {
      setMetadata({
        ...metadata,
        attributes: [...metadata.attributes, { ...newAttribute }],
      });
      setNewAttribute({ trait_type: '', value: '' });
    }
  };

  const removeAttribute = (index: number) => {
    setMetadata({
      ...metadata,
      attributes: metadata.attributes.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(metadata);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">NFT Metadata Editor</h3>
          <span className="text-sm text-gray-500">#{tokenId}</span>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={metadata.name}
            onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
            disabled={!isEditing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
            placeholder="Creative name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={metadata.description}
            onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
            disabled={!isEditing}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
            placeholder="Describe your creative..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={metadata.category}
            onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
            disabled={!isEditing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
          >
            <option value="">Select category</option>
            <option value="banner">Banner Ad</option>
            <option value="video">Video Ad</option>
            <option value="social">Social Media</option>
            <option value="print">Print Ad</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags ({metadata.tags.length}/10)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {metadata.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                {isEditing && (
                  <button onClick={() => removeTag(index)} className="hover:text-blue-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          {isEditing && metadata.tags.length < 10 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Add tag..."
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Attributes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Custom Attributes</label>
          <div className="space-y-2 mb-2">
            {metadata.attributes.map((attr, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">{attr.trait_type}:</span>
                  <span className="text-sm text-gray-600 ml-2">{attr.value}</span>
                </div>
                {isEditing && (
                  <button
                    onClick={() => removeAttribute(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newAttribute.trait_type}
                onChange={(e) =>
                  setNewAttribute({ ...newAttribute, trait_type: e.target.value })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Trait type (e.g., Size)"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAttribute.value}
                  onChange={(e) =>
                    setNewAttribute({ ...newAttribute, value: e.target.value })
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Value (e.g., 1920x1080)"
                />
                <button
                  onClick={addAttribute}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* External URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">External URL</label>
          <input
            type="url"
            value={metadata.externalUrl}
            onChange={(e) => setMetadata({ ...metadata, externalUrl: e.target.value })}
            disabled={!isEditing}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
            placeholder="https://..."
          />
        </div>

        {/* Background Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Background Color
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={metadata.backgroundColor}
              onChange={(e) =>
                setMetadata({ ...metadata, backgroundColor: e.target.value })
              }
              disabled={!isEditing}
              className="h-10 w-20 rounded border border-gray-300 disabled:opacity-50"
            />
            <input
              type="text"
              value={metadata.backgroundColor}
              onChange={(e) =>
                setMetadata({ ...metadata, backgroundColor: e.target.value })
              }
              disabled={!isEditing}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
              placeholder="#ffffff"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
