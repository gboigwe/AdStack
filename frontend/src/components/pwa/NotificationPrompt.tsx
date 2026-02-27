'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Check, X, AlertTriangle } from 'lucide-react';
import {
  isPushSupported,
  getPermissionStatus,
  requestPermission,
  type NotificationPermission,
} from '@/lib/push-notifications';

interface NotificationPromptProps {
  onPermissionChange?: (permission: NotificationPermission) => void;
}

export function NotificationPrompt({ onPermissionChange }: NotificationPromptProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    setPermission(getPermissionStatus());

    const stored = localStorage.getItem('adstack-notification-prompt-dismissed');
    if (stored === 'true') setDismissed(true);
  }, []);

  const handleEnable = useCallback(async () => {
    setRequesting(true);
    const result = await requestPermission();
    setPermission(result);
    setRequesting(false);
    onPermissionChange?.(result);

    if (result === 'granted' || result === 'denied') {
      setDismissed(true);
    }
  }, [onPermissionChange]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem('adstack-notification-prompt-dismissed', 'true');
  }, []);

  if (!supported || dismissed || permission === 'granted') return null;

  if (permission === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800">Notifications Blocked</p>
          <p className="text-sm text-red-600 mt-1">
            Notifications are currently blocked. To enable them, update your browser settings for this site.
          </p>
        </div>
        <button onClick={handleDismiss} className="text-red-400 hover:text-red-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
      <Bell className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-900">Stay Updated</p>
        <p className="text-sm text-blue-700 mt-1">
          Get notified about campaign milestones, bid results, and important platform updates.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleEnable}
            disabled={requesting}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {requesting ? 'Requesting...' : 'Enable Notifications'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

interface NotificationToggleProps {
  onToggle?: (enabled: boolean) => void;
}

export function NotificationToggle({ onToggle }: NotificationToggleProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isPushSupported());
    setPermission(getPermissionStatus());
  }, []);

  const handleToggle = useCallback(async () => {
    if (permission === 'granted') {
      onToggle?.(false);
      return;
    }

    const result = await requestPermission();
    setPermission(result);
    onToggle?.(result === 'granted');
  }, [permission, onToggle]);

  if (!supported) return null;

  const isEnabled = permission === 'granted';
  const Icon = isEnabled ? Bell : BellOff;

  return (
    <button
      onClick={handleToggle}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isEnabled
          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {isEnabled ? 'Notifications On' : 'Enable Notifications'}
      {isEnabled && <Check className="w-3.5 h-3.5" />}
    </button>
  );
}
