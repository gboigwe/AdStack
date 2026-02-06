'use client';

import { Award, TrendingUp } from 'lucide-react';

const TIERS = [
  { name: 'Bronze', threshold: '100K', color: 'bg-amber-700', icon: '🥉' },
  { name: 'Silver', threshold: '500K', color: 'bg-gray-400', icon: '🥈' },
  { name: 'Gold', threshold: '1M', color: 'bg-yellow-500', icon: '🥇' },
  { name: 'Platinum', threshold: '5M', color: 'bg-blue-400', icon: '💎' },
  { name: 'Diamond', threshold: '10M', color: 'bg-purple-500', icon: '👑' },
];

export function ImpressionShowcase() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Achievement NFTs</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TIERS.map((tier) => (
          <div key={tier.name} className={`${tier.color} text-white rounded-lg p-6 shadow-lg`}>
            <div className="text-4xl mb-4">{tier.icon}</div>
            <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
            <p className="text-sm opacity-90">{tier.threshold} impressions</p>
          </div>
        ))}
      </div>
    </div>
  );
}
