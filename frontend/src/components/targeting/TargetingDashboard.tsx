'use client';

import { useState } from 'react';
import { Settings2, LayoutGrid, BarChart2, Shield } from 'lucide-react';
import { TargetingRuleBuilder } from './TargetingRuleBuilder';
import { AudienceSegmentCreator } from './AudienceSegmentCreator';
import { SegmentAnalyticsPanel } from './SegmentAnalyticsPanel';
import { TargetingPreview } from './TargetingPreview';
import { MatchRateCalculator } from './MatchRateCalculator';
import { GeoTargetingMap } from './GeoTargetingMap';
import { DeviceSelector } from './DeviceSelector';
import { InterestTaxonomy } from './InterestTaxonomy';
import { ExclusionListManager } from './ExclusionListManager';
import { ConsentManagement } from './ConsentManagement';
import { PrivacySettingsUI } from './PrivacySettingsUI';
import { TargetingPerformanceMetrics } from './TargetingPerformanceMetrics';

type TabKey = 'targeting' | 'segments' | 'analytics' | 'privacy';

const TABS: { key: TabKey; label: string; icon: typeof Settings2 }[] = [
  { key: 'targeting', label: 'Targeting', icon: Settings2 },
  { key: 'segments', label: 'Segments', icon: LayoutGrid },
  { key: 'analytics', label: 'Analytics', icon: BarChart2 },
  { key: 'privacy', label: 'Privacy', icon: Shield },
];

export function TargetingDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('targeting');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Demographic Targeting</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure audience segments, targeting rules, and privacy settings
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'targeting' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TargetingRuleBuilder campaignId={1} />
            <TargetingPreview />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GeoTargetingMap />
            <DeviceSelector />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InterestTaxonomy />
            <ExclusionListManager />
          </div>
        </div>
      )}

      {activeTab === 'segments' && (
        <div className="space-y-6">
          <AudienceSegmentCreator />
          <MatchRateCalculator />
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <TargetingPerformanceMetrics />
          <SegmentAnalyticsPanel />
        </div>
      )}

      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PrivacySettingsUI />
            <ConsentManagement />
          </div>
        </div>
      )}
    </div>
  );
}
