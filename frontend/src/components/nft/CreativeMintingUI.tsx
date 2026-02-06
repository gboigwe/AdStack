'use client';

import { useState } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';

interface CreativeFormData {
  name: string;
  description: string;
  mediaFile: File | null;
  mediaType: string;
  ipfsHash: string;
  licenseType: string;
  commercialUse: boolean;
  category: string;
  tags: string[];
}

export function CreativeMintingUI() {
  const { address, isConnected } = useWalletStore();
  const [formData, setFormData] = useState<CreativeFormData>({
    name: '',
    description: '',
    mediaFile: null,
    mediaType: '',
    ipfsHash: '',
    licenseType: 'CC-BY',
    commercialUse: true,
    category: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        mediaFile: file,
        mediaType: file.type,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadToIPFS = async () => {
    if (!formData.mediaFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // TODO: Implement actual IPFS upload
      // const ipfsHash = await uploadToIPFS(formData.mediaFile);

      // Simulate IPFS upload
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const mockHash = 'Qm' + Math.random().toString(36).substring(2, 48);

      setFormData((prev) => ({ ...prev, ipfsHash: mockHash }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload to IPFS');
    } finally {
      setUploading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags.length < 10) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleMint = async () => {
    if (!formData.name || !formData.ipfsHash) {
      setError('Please fill in all required fields and upload media');
      return;
    }

    setMinting(true);
    setError('');

    try {
      // TODO: Call ad-creative-nft contract to mint
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSuccess(true);
      // Reset form
      setFormData({
        name: '',
        description: '',
        mediaFile: null,
        mediaType: '',
        ipfsHash: '',
        licenseType: 'CC-BY',
        commercialUse: true,
        category: '',
        tags: [],
      });
      setPreview('');

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to mint NFT');
    } finally {
      setMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Wallet</h2>
          <p className="text-gray-600">Connect your wallet to mint ad creative NFTs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mint Ad Creative NFT</h1>
        <p className="text-gray-600">Create an NFT for your ad creative with ownership proof</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Creative Media *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded"
                  />
                  <button
                    onClick={() => {
                      setPreview('');
                      setFormData((prev) => ({ ...prev, mediaFile: null, ipfsHash: '' }));
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Choose file
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, GIF, MP4 up to 50MB
                  </p>
                </>
              )}
            </div>

            {formData.mediaFile && !formData.ipfsHash && (
              <button
                onClick={handleUploadToIPFS}
                disabled={uploading}
                className="mt-4 w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                {uploading ? 'Uploading to IPFS...' : 'Upload to IPFS'}
              </button>
            )}

            {formData.ipfsHash && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-800">
                    Uploaded: <code className="font-mono text-xs">{formData.ipfsHash}</code>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Creative Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Summer Sale Banner"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              maxLength={256}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your creative"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={1024}
            />
          </div>

          {/* Category & License Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                <option value="banner">Banner</option>
                <option value="video">Video Ad</option>
                <option value="social">Social Media</option>
                <option value="print">Print</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="license" className="block text-sm font-medium text-gray-700 mb-2">
                License Type
              </label>
              <select
                id="license"
                value={formData.licenseType}
                onChange={(e) => setFormData((prev) => ({ ...prev, licenseType: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="CC-BY">CC-BY (Attribution)</option>
                <option value="CC-BY-NC">CC-BY-NC (Non-Commercial)</option>
                <option value="CC-BY-SA">CC-BY-SA (Share-Alike)</option>
                <option value="All-Rights">All Rights Reserved</option>
              </select>
            </div>
          </div>

          {/* Commercial Use */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="commercial"
              checked={formData.commercialUse}
              onChange={(e) => setFormData((prev) => ({ ...prev, commercialUse: e.target.checked }))}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="commercial" className="text-sm text-gray-700">
              Allow commercial use
            </label>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (max 10)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                maxLength={32}
              />
              <button
                onClick={handleAddTag}
                disabled={formData.tags.length >= 10}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">NFT minted successfully!</p>
            </div>
          )}
        </div>

        {/* Mint Button */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={handleMint}
            disabled={minting || !formData.ipfsHash}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {minting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Minting NFT...
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                Mint Creative NFT
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">About NFT Minting</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your creative is stored on IPFS for permanent accessibility</li>
          <li>• NFT proves ownership and creation timestamp</li>
          <li>• 10% royalty on all secondary sales</li>
          <li>• Tradeable on the creative marketplace</li>
        </ul>
      </div>
    </div>
  );
}
