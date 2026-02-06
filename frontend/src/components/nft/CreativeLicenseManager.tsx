'use client';

import { useState } from 'react';
import { FileText, Calendar, DollarSign, Check, X, Clock, Shield } from 'lucide-react';

interface License {
  licenseId: number;
  tokenId: number;
  licensee: string;
  startDate: number;
  endDate: number;
  duration: number;
  pricePerDay: number;
  totalPaid: number;
  commercialAllowed: boolean;
  status: 'active' | 'expired' | 'pending';
}

interface LicenseOffer {
  tokenId: number;
  pricePerDay: number;
  maxDuration: number;
  commercialAllowed: boolean;
}

export function CreativeLicenseManager() {
  const [activeTab, setActiveTab] = useState<'my-licenses' | 'offer-license'>('my-licenses');
  const [selectedToken, setSelectedToken] = useState<number | null>(null);

  // Mock data
  const myLicenses: License[] = [
    {
      licenseId: 1,
      tokenId: 42,
      licensee: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      startDate: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
      endDate: Date.now() + 25 * 24 * 60 * 60 * 1000, // 25 days from now
      duration: 30,
      pricePerDay: 5,
      totalPaid: 150,
      commercialAllowed: true,
      status: 'active',
    },
    {
      licenseId: 2,
      tokenId: 38,
      licensee: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      startDate: Date.now() - 40 * 24 * 60 * 60 * 1000,
      endDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
      duration: 30,
      pricePerDay: 3,
      totalPaid: 90,
      commercialAllowed: false,
      status: 'expired',
    },
  ];

  const [licenseForm, setLicenseForm] = useState({
    pricePerDay: '',
    maxDuration: '',
    commercialAllowed: false,
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: number) => {
    const days = Math.ceil((endDate - Date.now()) / (24 * 60 * 60 * 1000));
    return days > 0 ? days : 0;
  };

  const handleOfferLicense = () => {
    console.log('Offering license:', {
      tokenId: selectedToken,
      ...licenseForm,
    });
    // TODO: Implement contract call
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">License Management</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('my-licenses')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'my-licenses'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          My Licenses
        </button>
        <button
          onClick={() => setActiveTab('offer-license')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'offer-license'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Offer License
        </button>
      </div>

      {/* My Licenses Tab */}
      {activeTab === 'my-licenses' && (
        <div className="space-y-4">
          {myLicenses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No licenses found</p>
            </div>
          ) : (
            myLicenses.map((license) => (
              <div
                key={license.licenseId}
                className="bg-white rounded-lg shadow p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">License #{license.licenseId}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          license.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {license.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      NFT #{license.tokenId} • {license.commercialAllowed ? 'Commercial' : 'Personal'} Use
                    </p>
                  </div>
                  {license.status === 'active' && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-orange-600">
                        {getDaysRemaining(license.endDate)} days left
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Start Date</p>
                    <p className="text-sm font-medium">{formatDate(license.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">End Date</p>
                    <p className="text-sm font-medium">{formatDate(license.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Duration</p>
                    <p className="text-sm font-medium">{license.duration} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                    <p className="text-sm font-medium">{license.totalPaid} STX</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500 mb-1">Licensee</p>
                  <p className="text-xs font-mono bg-gray-50 p-2 rounded">
                    {license.licensee}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Offer License Tab */}
      {activeTab === 'offer-license' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Create License Offer</h3>
          </div>

          <div className="space-y-6">
            {/* Token Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select NFT to License
              </label>
              <select
                value={selectedToken || ''}
                onChange={(e) => setSelectedToken(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Choose NFT...</option>
                <option value="1">NFT #1 - Summer Campaign Banner</option>
                <option value="2">NFT #2 - Product Launch Video</option>
                <option value="3">NFT #3 - Social Media Creative</option>
              </select>
            </div>

            {selectedToken && (
              <>
                {/* Price per Day */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Day (STX)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={licenseForm.pricePerDay}
                      onChange={(e) =>
                        setLicenseForm({ ...licenseForm, pricePerDay: e.target.value })
                      }
                      placeholder="5.00"
                      min="0.01"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Daily rental price for using this creative
                  </p>
                </div>

                {/* Max Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Duration (days)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={licenseForm.maxDuration}
                      onChange={(e) =>
                        setLicenseForm({ ...licenseForm, maxDuration: e.target.value })
                      }
                      placeholder="30"
                      min="1"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of days someone can license this creative
                  </p>
                </div>

                {/* Commercial Use */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={licenseForm.commercialAllowed}
                      onChange={(e) =>
                        setLicenseForm({
                          ...licenseForm,
                          commercialAllowed: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Allow commercial use
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    Permit licensees to use this creative for commercial purposes
                  </p>
                </div>

                {/* Preview */}
                {licenseForm.pricePerDay && licenseForm.maxDuration && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">License Preview</p>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p>
                        <Check className="w-4 h-4 inline mr-1" />
                        Daily rate: {licenseForm.pricePerDay} STX
                      </p>
                      <p>
                        <Check className="w-4 h-4 inline mr-1" />
                        Max duration: {licenseForm.maxDuration} days
                      </p>
                      <p>
                        <Check className="w-4 h-4 inline mr-1" />
                        Max revenue: {(parseFloat(licenseForm.pricePerDay) * parseInt(licenseForm.maxDuration)).toFixed(2)} STX
                      </p>
                      <p>
                        {licenseForm.commercialAllowed ? (
                          <Check className="w-4 h-4 inline mr-1" />
                        ) : (
                          <X className="w-4 h-4 inline mr-1" />
                        )}
                        Commercial use {licenseForm.commercialAllowed ? 'allowed' : 'prohibited'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleOfferLicense}
                    disabled={!licenseForm.pricePerDay || !licenseForm.maxDuration}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    Create License Offer
                  </button>
                  <button
                    onClick={() => {
                      setSelectedToken(null);
                      setLicenseForm({
                        pricePerDay: '',
                        maxDuration: '',
                        commercialAllowed: false,
                      });
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
