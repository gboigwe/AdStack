import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Clock, Shield } from 'lucide-react';

interface Validator {
  address: string;
  name: string;
  isActive: bool;
  signaturesCount: number;
  uptime: number;
  lastActive: number;
}

const mockValidators: Validator[] = [
  {
    address: 'SP2J6ZY...ABC123',
    name: 'Validator 1',
    isActive: true,
    signaturesCount: 1245,
    uptime: 99.8,
    lastActive: Date.now() - 300000,
  },
  {
    address: 'SP3K7L9...DEF456',
    name: 'Validator 2',
    isActive: true,
    signaturesCount: 1198,
    uptime: 99.5,
    lastActive: Date.now() - 120000,
  },
  {
    address: 'SP4M8N0...GHI789',
    name: 'Validator 3',
    isActive: true,
    signaturesCount: 1302,
    uptime: 99.9,
    lastActive: Date.now() - 60000,
  },
  {
    address: 'SP5P9Q1...JKL012',
    name: 'Validator 4',
    isActive: true,
    signaturesCount: 1156,
    uptime: 98.7,
    lastActive: Date.now() - 240000,
  },
  {
    address: 'SP6R0S2...MNO345',
    name: 'Validator 5',
    isActive: false,
    signaturesCount: 892,
    uptime: 95.2,
    lastActive: Date.now() - 3600000,
  },
];

export default function ValidatorMonitor() {
  const [validators, setValidators] = useState<Validator[]>(mockValidators);

  useEffect(() => {
    // In production, fetch validator status from API
    const interval = setInterval(() => {
      // Simulate updates
      setValidators(prev => prev.map(v => ({
        ...v,
        lastActive: v.isActive ? Date.now() - Math.random() * 300000 : v.lastActive,
      })));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const activeValidators = validators.filter(v => v.isActive).length;
  const totalValidators = validators.length;
  const averageUptime = validators.reduce((sum, v) => sum + v.uptime, 0) / totalValidators;

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm font-medium">Active Validators</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeValidators}/{totalValidators}
            </div>
            <p className="text-xs text-muted-foreground">Min required: 3</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageUptime.toFixed(1)}%</div>
            <Progress value={averageUptime} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {validators.reduce((sum, v) => sum + v.signaturesCount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Validator List */}
      <Card>
        <CardHeader>
          <CardTitle>Validator Network</CardTitle>
          <CardDescription>Real-time status of bridge validators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {validators.map((validator) => (
              <div
                key={validator.address}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div>
                    {validator.isActive ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{validator.name}</span>
                      <Badge variant={validator.isActive ? 'default' : 'secondary'}>
                        {validator.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {validator.address}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Signatures</div>
                    <div className="font-medium">{validator.signaturesCount.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Uptime</div>
                    <div className="font-medium">{validator.uptime}%</div>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last Active
                    </div>
                    <div className="font-medium">{formatTimestamp(validator.lastActive)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Network Health */}
      <Card>
        <CardHeader>
          <CardTitle>Network Health</CardTitle>
          <CardDescription>Bridge network performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Validator Redundancy</span>
                <span className="font-medium text-green-600">
                  {Math.floor((activeValidators / 3) * 100)}% ({activeValidators}/3 required)
                </span>
              </div>
              <Progress value={(activeValidators / totalValidators) * 100} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Network Uptime</span>
                <span className="font-medium text-green-600">{averageUptime.toFixed(2)}%</span>
              </div>
              <Progress value={averageUptime} />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">Healthy Validators</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {validators.filter(v => v.uptime > 99).length}
                </div>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="text-sm text-orange-600 dark:text-orange-400">
                  Needs Attention
                </div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {validators.filter(v => v.uptime < 99 && v.uptime > 95).length}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
