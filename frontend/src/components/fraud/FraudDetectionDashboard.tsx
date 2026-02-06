'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, TrendingUp, Activity, CheckCircle, XCircle } from 'lucide-react';

interface FraudStats {
  totalPredictions: number;
  fraudDetected: number;
  falsePositives: number;
  truePositives: number;
  accuracy: number;
  precision: number;
  recall: number;
}

interface RecentDetection {
  id: number;
  campaignId: number;
  publisherId: string;
  fraudScore: number;
  confidence: number;
  riskLevel: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'dismissed';
}

export function FraudDetectionDashboard() {
  const [stats, setStats] = useState<FraudStats>({
    totalPredictions: 1547,
    fraudDetected: 142,
    falsePositives: 8,
    truePositives: 134,
    accuracy: 94.2,
    precision: 94.4,
    recall: 92.7,
  });

  const [recentDetections, setRecentDetections] = useState<RecentDetection[]>([
    {
      id: 1,
      campaignId: 42,
      publisherId: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      fraudScore: 0.94,
      confidence: 0.96,
      riskLevel: 'critical',
      timestamp: new Date().toISOString(),
      status: 'pending',
    },
    {
      id: 2,
      campaignId: 38,
      publisherId: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      fraudScore: 0.78,
      confidence: 0.85,
      riskLevel: 'high',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'confirmed',
    },
    {
      id: 3,
      campaignId: 51,
      publisherId: 'SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
      fraudScore: 0.63,
      confidence: 0.72,
      riskLevel: 'medium',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'dismissed',
    },
  ]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'dismissed':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Activity className="w-4 h-4 text-blue-600 animate-pulse" />;
    }
  };

  const fraudRate = ((stats.fraudDetected / stats.totalPredictions) * 100).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Fraud Detection Dashboard</h1>
          <p className="text-gray-600 mt-1">AI-powered real-time fraud monitoring</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
          <Shield className="w-5 h-5" />
          <span className="font-medium">System Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Predictions</p>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold">{stats.totalPredictions.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Fraud Detected</p>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.fraudDetected}</p>
          <p className="text-sm text-gray-500 mt-1">{fraudRate}% of total</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Model Accuracy</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.accuracy}%</p>
          <p className="text-sm text-gray-500 mt-1">+2.3% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">False Positives</p>
            <Shield className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600">{stats.falsePositives}</p>
          <p className="text-sm text-gray-500 mt-1">
            {((stats.falsePositives / stats.fraudDetected) * 100).toFixed(1)}% of detections
          </p>
        </div>
      </div>

      {/* Model Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Model Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Precision</span>
              <span className="text-sm font-semibold">{stats.precision}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${stats.precision}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Recall</span>
              <span className="text-sm font-semibold">{stats.recall}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${stats.recall}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">F1 Score</span>
              <span className="text-sm font-semibold">
                {((2 * stats.precision * stats.recall) / (stats.precision + stats.recall)).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{
                  width: `${((2 * stats.precision * stats.recall) / (stats.precision + stats.recall)).toFixed(1)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Detections */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Recent Fraud Detections</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Publisher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fraud Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDetections.map((detection) => (
                <tr key={detection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      #{detection.campaignId}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-600">
                      {detection.publisherId.slice(0, 20)}...
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {(detection.fraudScore * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Confidence: {(detection.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskLevelColor(
                        detection.riskLevel
                      )}`}
                    >
                      {detection.riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(detection.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(detection.status)}
                      <span className="text-sm capitalize">{detection.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All Detections →
          </button>
        </div>
      </div>
    </div>
  );
}
