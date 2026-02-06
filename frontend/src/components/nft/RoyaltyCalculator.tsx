'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';

export function RoyaltyCalculator() {
  const [salePrice, setSalePrice] = useState('');
  const royaltyPercentage = 10;

  const royaltyAmount = salePrice ? (parseFloat(salePrice) * royaltyPercentage) / 100 : 0;
  const sellerAmount = salePrice ? parseFloat(salePrice) - royaltyAmount : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Royalty Calculator</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sale Price (STX)
          </label>
          <input
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {salePrice && (
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Creator Royalty (10%)</span>
              <span className="font-semibold text-purple-600">{royaltyAmount.toFixed(2)} STX</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Seller Receives</span>
              <span className="font-semibold text-green-600">{sellerAmount.toFixed(2)} STX</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
