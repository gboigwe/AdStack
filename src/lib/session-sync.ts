/**
 * Cross-Device Session Sync
 * Syncs user session data across multiple devices using Gaia
 */

import { putData, getData } from './gaia-storage';
import { getStoragePath } from './gaia-config';
import { getUserSession, getIdentityAddress } from './auth';

export interface SessionData {
  userId: string;
  lastActive: number;
  deviceId: string;
  deviceName: string;
  preferences: any;
  recentActivity: Array<{
    type: string;
    timestamp: number;
    data: any;
  }>;
}

// Get current device ID
function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';

  let deviceId = localStorage.getItem('device_id');

  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }

  return deviceId;
}

// Get device name
function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Server';

  const userAgent = navigator.userAgent;

  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    return 'Mobile Device';
  } else if (/Mac/.test(userAgent)) {
    return 'Mac';
  } else if (/Windows/.test(userAgent)) {
    return 'Windows PC';
  } else if (/Linux/.test(userAgent)) {
    return 'Linux';
  }

  return 'Unknown Device';
}

// Sync session to Gaia
export async function syncSession(additionalData?: Partial<SessionData>): Promise<void> {
  try {
    const userId = getIdentityAddress();
    const deviceId = getDeviceId();
    const deviceName = getDeviceName();

    const sessionData: SessionData = {
      userId,
      lastActive: Date.now(),
      deviceId,
      deviceName,
      preferences: {},
      recentActivity: [],
      ...additionalData
    };

    const path = getStoragePath('profile', 'session.json');
    await putData(path, sessionData, { encrypt: true });
  } catch (error) {
    console.error('Session sync error:', error);
  }
}

// Load session from Gaia
export async function loadSession(): Promise<SessionData | null> {
  try {
    const path = getStoragePath('profile', 'session.json');
    const sessionData = await getData<SessionData>(path, { decrypt: true });
    return sessionData;
  } catch (error) {
    console.error('Session load error:', error);
    return null;
  }
}

// Auto-sync session every 5 minutes
let syncInterval: NodeJS.Timeout | null = null;

export function startAutoSync(): void {
  stopAutoSync();

  syncInterval = setInterval(() => {
    syncSession().catch(console.error);
  }, 5 * 60 * 1000); // 5 minutes
}

export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export default { syncSession, loadSession, startAutoSync, stopAutoSync };
