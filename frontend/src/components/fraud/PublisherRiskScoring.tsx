'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, User, TrendingDown, Ban } from 'lucide-react';

interface PublisherRisk {
  publisherId: string;
  totalFlags: number;
  confirmedFraud: number;
  falseFlags: number;
  riskScore: number;
  lastIncident: string;
  isBlacklisted: boolean;
  behavioralScore: number;
}

export function PublisherRiskScoring() {
  const [publishers, setPublishers] = useState<PublisherRisk[]>([
    {
      publisherId: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      totalFlags: 15,
      confirmedFraud: 12,
      falseFlags: 3,
      riskScore: 85,
      lastIncident: new Date(Date.now() - 86400000).toISOString(),
      isBlacklisted: false,
      behavioralScore: 32,
    },
    {
      publisherId: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      totalFlags: 8,
      confirmedFraud: 5,
      falseFlags: 3,
      riskScore: 62,
      lastIncident: new Date(Date.now() - 172800000).toISOString(),
      isBlacklisted: false,
      behavioralScore: 48,
    },
    {
      publisherId: 'SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
      totalFlags: 2,
      confirmedFraud: 0,
      falseFlags: 2,
      riskScore: 15,
      lastIncident: new Date(Date.now() - 604800000).toISOString(),
      isBlacklisted: false,
      behavioralScore: 78,
    },
    {
      publisherId: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9',
      totalFlags: 25,
      confirmedFraud: 23,
      falseFlags: 2,
      riskScore: 95,
      lastIncident: new Date(Date.now() - 43200000).toISOString(),
      isBlacklisted: true,
      behavioralScore: 12,
    },
  ]);

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: 'Critical', color: 'text-red-600 bg-red-100' };
    if (score >= 60) return { label: 'High', color: 'text-orange-600 bg-orange-100' };
    if (score >= 40) return { label: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'Low', color: 'text-green-600 bg-green-100' };
  };

  const getBehavioralRating = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600' };
    return { label: 'Poor', color: 'text-red-600' };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Publisher Risk Scoring</h2>
        <p className="text-gray-600 mt-1">Monitor publisher fraud history and behavioral patterns</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Publisher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Risk Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Behavioral
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fraud History
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Last Incident
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {publishers.map((publisher) => {
              const riskLevel = getRiskLevel(publisher.riskScore);
              const behavioral = getBehavioralRating(publisher.behavioralScore);
              const fraudRate = publisher.totalFlags > 0
                ? ((publisher.confirmedFraud / publisher.totalFlags) * 100).toFixed(0)
                : '0';

              return (
                <tr key={publisher.publisherId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-mono">
                        {publisher.publisherId.slice(0, 15)}...
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-lg font-bold ${riskLevel.color.split(' ')[0]}`}>
                          {publisher.riskScore}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${riskLevel.color}`}>
                          {riskLevel.label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            publisher.riskScore >= 80
                              ? 'bg-red-600'
                              : publisher.riskScore >= 60
                              ? 'bg-orange-600'
                              : publisher.riskScore >= 40
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${publisher.riskScore}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <div className={`text-sm font-semibold ${behavioral.color}`}>
                        {behavioral.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        Score: {publisher.behavioralScore}/100
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center gap-4 mb-1">
                        <span className="text-gray-600">
                          {publisher.totalFlags} flags
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {publisher.confirmedFraud} confirmed ({fraudRate}%)
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(publisher.lastIncident).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4">
                    {publisher.isBlacklisted ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <Ban className="w-4 h-4" />
                        <span className="text-sm font-medium">Blacklisted</span>
                      </div>
                    ) : publisher.riskScore >= 80 ? (
                      <div className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">At Risk</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Active</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
