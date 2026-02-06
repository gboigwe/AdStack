'use client';

import { useState } from 'react';
import { Bell, AlertOctagon, TrendingUp, Zap, X } from 'lucide-react';

interface Anomaly {
  id: number;
  campaignId: number;
  publisherId: string;
  type: 'ctr' | 'volume' | 'velocity' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  zScore: number;
  actualValue: number;
  expectedValue: number;
  deviation: number;
  timestamp: string;
  dismissed: boolean;
}

export function AnomalyAlertsPanel() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([
    {
      id: 1,
      campaignId: 42,
      publisherId: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      type: 'ctr',
      severity: 'critical',
      zScore: 4.2,
      actualValue: 15.3,
      expectedValue: 3.2,
      deviation: 378,
      timestamp: new Date().toISOString(),
      dismissed: false,
    },
    {
      id: 2,
      campaignId: 38,
      publisherId: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      type: 'volume',
      severity: 'high',
      zScore: 3.1,
      actualValue: 45000,
      expectedValue: 12000,
      deviation: 275,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      dismissed: false,
    },
    {
      id: 3,
      campaignId: 51,
      publisherId: 'SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
      type: 'velocity',
      severity: 'medium',
      zScore: 2.3,
      actualValue: 8500,
      expectedValue: 4200,
      deviation: 102,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      dismissed: false,
    },
  ]);

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'ctr':
        return <TrendingUp className="w-5 h-5" />;
      case 'volume':
        return <AlertOctagon className="w-5 h-5" />;
      case 'velocity':
        return <Zap className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-500';
      case 'high':
        return 'bg-orange-50 border-orange-500';
      case 'medium':
        return 'bg-yellow-50 border-yellow-500';
      default:
        return 'bg-blue-50 border-blue-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ctr':
        return 'CTR Anomaly';
      case 'volume':
        return 'Traffic Volume Spike';
      case 'velocity':
        return 'Velocity Anomaly';
      case 'pattern':
        return 'Pattern Deviation';
      default:
        return 'Unknown';
    }
  };

  const dismissAnomaly = (id: number) => {
    setAnomalies(anomalies.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
  };

  const activeAnomalies = anomalies.filter((a) => !a.dismissed);
  const criticalCount = activeAnomalies.filter((a) => a.severity === 'critical').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Anomaly Alerts</h2>
          <p className="text-gray-600 mt-1">Real-time behavioral anomaly detection</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full">
            <Bell className="w-4 h-4" />
            <span className="font-medium">{criticalCount} Critical</span>
          </div>
          <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full font-medium">
            {activeAnomalies.length} Active
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {activeAnomalies.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No active anomalies detected</p>
          </div>
        ) : (
          activeAnomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={`border-l-4 rounded-lg p-6 ${getSeverityColor(anomaly.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`p-3 rounded-lg ${
                      anomaly.severity === 'critical'
                        ? 'bg-red-100 text-red-600'
                        : anomaly.severity === 'high'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}
                  >
                    {getAnomalyIcon(anomaly.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{getTypeLabel(anomaly.type)}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          anomaly.severity === 'critical'
                            ? 'bg-red-200 text-red-800'
                            : anomaly.severity === 'high'
                            ? 'bg-orange-200 text-orange-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}
                      >
                        {anomaly.severity.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-600">Campaign #{anomaly.campaignId}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-xs font-mono text-gray-600">
                          {anomaly.publisherId.slice(0, 20)}...
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500">Actual Value</p>
                          <p className="font-semibold text-red-600">
                            {anomaly.actualValue.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Expected Value</p>
                          <p className="font-semibold">
                            {anomaly.expectedValue.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Z-Score</p>
                          <p className="font-semibold">{anomaly.zScore.toFixed(2)}σ</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Deviation</p>
                          <p className="font-semibold text-orange-600">+{anomaly.deviation}%</p>
                        </div>
                      </div>

                      <div className="pt-2 text-xs text-gray-500">
                        {new Date(anomaly.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => dismissAnomaly(anomaly.id)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  title="Dismiss alert"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
