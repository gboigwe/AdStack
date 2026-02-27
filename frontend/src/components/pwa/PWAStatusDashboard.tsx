'use client';

import { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  HardDrive,
  Bell,
  Download,
  RefreshCw,
  Trash2,
  Shield,
  Activity,
} from 'lucide-react';
import { usePWAContext } from './PWAProvider';
import { getPermissionStatus } from '@/lib/push-notifications';
import { getStorageEstimate, count, clearAllStores, STORES } from '@/lib/indexed-db';
import { getPendingCount } from '@/lib/background-sync';

interface StorageInfo {
  usage: number;
  quota: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function PWAStatusDashboard() {
  const { isOnline, effectiveType, swStatus } = usePWAContext();
  const [notificationPerm, setNotificationPerm] = useState('default');
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pendingSync, setPendingSync] = useState(0);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setNotificationPerm(getPermissionStatus());

    getStorageEstimate().then((est) => {
      if (est) setStorage(est);
    });

    Promise.all(
      Object.values(STORES).map(async (store) => {
        const c = await count(store);
        return [store, c] as const;
      })
    ).then((results) => {
      setCounts(Object.fromEntries(results));
    });

    getPendingCount().then(setPendingSync);
  }, []);

  const handleClearStorage = async () => {
    setClearing(true);
    try {
      await clearAllStores();

      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k.startsWith('adstack-')).map((k) => caches.delete(k)));
      }

      setCounts({});
      const est = await getStorageEstimate();
      if (est) setStorage(est);
    } finally {
      setClearing(false);
    }
  };

  const totalRecords = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const storagePercent = storage ? Math.round((storage.usage / storage.quota) * 100) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">PWA Status</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span className="text-sm font-medium text-gray-700">Network</span>
          </div>
          <p className={`text-lg font-semibold ${isOnline ? 'text-green-700' : 'text-red-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </p>
          {effectiveType && (
            <p className="text-xs text-gray-500 mt-1">Connection: {effectiveType}</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Service Worker</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 capitalize">{swStatus}</p>
          <p className="text-xs text-gray-500 mt-1">
            {swStatus === 'ready' ? 'Caching active' : swStatus === 'error' ? 'Registration failed' : 'Initializing'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Bell className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Notifications</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 capitalize">{notificationPerm}</p>
          <p className="text-xs text-gray-500 mt-1">
            {notificationPerm === 'granted' ? 'Push enabled' : notificationPerm === 'denied' ? 'Blocked by user' : 'Not requested'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Sync Queue</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{pendingSync}</p>
          <p className="text-xs text-gray-500 mt-1">
            {pendingSync === 0 ? 'All synced' : `${pendingSync} pending`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Offline Storage</h3>
          </div>
          <button
            onClick={handleClearStorage}
            disabled={clearing}
            className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {clearing ? 'Clearing...' : 'Clear All'}
          </button>
        </div>

        {storage && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">
                {formatBytes(storage.usage)} of {formatBytes(storage.quota)}
              </span>
              <span className="text-gray-500">{storagePercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total cached records</span>
            <span className="font-medium text-gray-900">{totalRecords}</span>
          </div>
          {Object.entries(counts)
            .filter(([, c]) => c > 0)
            .map(([store, c]) => (
              <div key={store} className="flex items-center justify-between text-sm">
                <span className="text-gray-500 capitalize">{store.replace('-', ' ')}</span>
                <span className="text-gray-700">{c}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
