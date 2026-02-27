'use client';

import { useState } from 'react';
import { Globe, MapPin, Plus, X, Search } from 'lucide-react';
import { type GeoRegion } from './types';

const AVAILABLE_REGIONS: GeoRegion[] = [
  { id: 1, name: 'North America', code: 'NA', tier: 1, isActive: true },
  { id: 2, name: 'Western Europe', code: 'WEU', tier: 1, isActive: true },
  { id: 3, name: 'East Asia', code: 'EA', tier: 1, isActive: false },
  { id: 4, name: 'Southeast Asia', code: 'SEA', tier: 2, isActive: false },
  { id: 5, name: 'South America', code: 'SA', tier: 2, isActive: false },
  { id: 6, name: 'Eastern Europe', code: 'EEU', tier: 2, isActive: false },
  { id: 7, name: 'Middle East', code: 'ME', tier: 2, isActive: false },
  { id: 8, name: 'Sub-Saharan Africa', code: 'SSA', tier: 3, isActive: false },
  { id: 9, name: 'South Asia', code: 'SAS', tier: 2, isActive: false },
  { id: 10, name: 'Oceania', code: 'OCE', tier: 2, isActive: false },
  { id: 11, name: 'Central America', code: 'CA', tier: 3, isActive: false },
  { id: 12, name: 'North Africa', code: 'NAF', tier: 3, isActive: false },
];

const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1 - Premium',
  2: 'Tier 2 - Standard',
  3: 'Tier 3 - Emerging',
};

const TIER_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-orange-100 text-orange-700',
};

interface GeoTargetingMapProps {
  onRegionsChange?: (regions: GeoRegion[]) => void;
}

export function GeoTargetingMap({ onRegionsChange }: GeoTargetingMapProps) {
  const [regions, setRegions] = useState<GeoRegion[]>(AVAILABLE_REGIONS);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  const selectedRegions = regions.filter((r) => r.isActive);
  const filteredRegions = regions.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase());
    const matchesTier = selectedTier === null || r.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const toggleRegion = (id: number) => {
    const updated = regions.map((r) =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    );
    setRegions(updated);
    onRegionsChange?.(updated.filter((r) => r.isActive));
  };

  const estimatedReach = selectedRegions.reduce((total, r) => {
    const baseReach: Record<number, number> = { 1: 25000, 2: 12000, 3: 5000 };
    return total + (baseReach[r.tier] || 5000);
  }, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Globe className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Geo-Targeting</h2>
            <p className="text-sm text-gray-500">Select regions for campaign targeting</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900">{selectedRegions.length} regions</div>
          <div className="text-xs text-gray-400">~{estimatedReach.toLocaleString()} reach</div>
        </div>
      </div>

      {selectedRegions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedRegions.map((r) => (
            <span
              key={r.id}
              className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700"
            >
              <MapPin className="w-3 h-3" />
              {r.name}
              <button onClick={() => toggleRegion(r.id)} className="ml-1 hover:text-emerald-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search regions..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setSelectedTier(null)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedTier === null ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            All
          </button>
          {[1, 2, 3].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedTier === tier ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              T{tier}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {filteredRegions.map((region) => (
          <button
            key={region.id}
            onClick={() => toggleRegion(region.id)}
            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
              region.isActive
                ? 'bg-emerald-50 border border-emerald-200'
                : 'border border-transparent hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                region.isActive
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-gray-300'
              }`}>
                {region.isActive && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-900">{region.name}</span>
                <span className="text-xs text-gray-400 ml-2">{region.code}</span>
              </div>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TIER_COLORS[region.tier]}`}>
              {TIER_LABELS[region.tier]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
