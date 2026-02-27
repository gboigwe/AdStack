'use client';

import { useState } from 'react';
import { Monitor, Smartphone, Tablet, Tv, Watch, Gamepad2 } from 'lucide-react';
import { DEVICE_TYPES } from './types';

interface DeviceTarget {
  type: string;
  label: string;
  icon: typeof Monitor;
  enabled: boolean;
  share: number;
  avgCpm: number;
}

interface DeviceSelectorProps {
  onDevicesChange?: (devices: string[]) => void;
}

export function DeviceSelector({ onDevicesChange }: DeviceSelectorProps) {
  const [devices, setDevices] = useState<DeviceTarget[]>([
    { type: 'desktop', label: 'Desktop', icon: Monitor, enabled: true, share: 32, avgCpm: 4.2 },
    { type: 'mobile', label: 'Mobile', icon: Smartphone, enabled: true, share: 48, avgCpm: 3.1 },
    { type: 'tablet', label: 'Tablet', icon: Tablet, enabled: false, share: 12, avgCpm: 3.6 },
    { type: 'smart_tv', label: 'Smart TV', icon: Tv, enabled: false, share: 5, avgCpm: 5.8 },
    { type: 'wearable', label: 'Wearable', icon: Watch, enabled: false, share: 2, avgCpm: 2.4 },
    { type: 'console', label: 'Console', icon: Gamepad2, enabled: false, share: 1, avgCpm: 6.2 },
  ]);

  const toggleDevice = (type: string) => {
    const updated = devices.map((d) =>
      d.type === type ? { ...d, enabled: !d.enabled } : d
    );
    setDevices(updated);
    onDevicesChange?.(updated.filter((d) => d.enabled).map((d) => d.type));
  };

  const enabledDevices = devices.filter((d) => d.enabled);
  const totalShare = enabledDevices.reduce((s, d) => s + d.share, 0);
  const weightedCpm = enabledDevices.length > 0
    ? enabledDevices.reduce((s, d) => s + d.avgCpm * d.share, 0) / totalShare
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-50 rounded-lg">
            <Monitor className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Device Targeting</h2>
            <p className="text-sm text-gray-500">Select target device types</p>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>{totalShare}% audience share</div>
          <div className="text-violet-600 font-medium">{weightedCpm.toFixed(2)} STX avg CPM</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {devices.map((device) => {
          const Icon = device.icon;
          return (
            <button
              key={device.type}
              onClick={() => toggleDevice(device.type)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                device.enabled
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className={`w-6 h-6 ${device.enabled ? 'text-violet-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${device.enabled ? 'text-violet-900' : 'text-gray-600'}`}>
                {device.label}
              </span>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <span>{device.share}% share</span>
                <span>{device.avgCpm} CPM</span>
              </div>
            </button>
          );
        })}
      </div>

      {enabledDevices.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Audience Share Breakdown</h3>
          <div className="flex h-4 rounded-full overflow-hidden">
            {enabledDevices.map((d) => {
              const normalizedWidth = (d.share / totalShare) * 100;
              return (
                <div
                  key={d.type}
                  className="bg-violet-500 first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${normalizedWidth}%`,
                    opacity: 0.4 + (d.share / 100) * 0.6,
                  }}
                  title={`${d.label}: ${d.share}%`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            {enabledDevices.map((d) => (
              <span key={d.type} className="text-[10px] text-gray-400">{d.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
