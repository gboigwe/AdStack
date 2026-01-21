'use client';

import { useState, useEffect } from 'react';
import {
  getUserPreferences,
  updatePrivacySettings
} from '@/lib/user-preferences';
import type { PrivacySettings } from '@/types/user-profile';

export default function PrivacyControls() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const prefs = await getUserPreferences();
      setSettings(prefs.privacy);
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof PrivacySettings) => {
    if (!settings) return;

    setSaving(true);
    try {
      const updated = { ...settings, [key]: !settings[key] };
      await updatePrivacySettings(updated);
      setSettings(updated);
    } catch (error) {
      console.error('Error updating setting:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-4">Loading privacy settings...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Privacy Controls</h2>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 border rounded">
          <div>
            <h3 className="font-semibold">Profile Visibility</h3>
            <p className="text-sm text-gray-600">
              {settings.profileVisibility}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 border rounded">
          <div>
            <h3 className="font-semibold">Show Stats</h3>
            <p className="text-sm text-gray-600">Display campaign statistics</p>
          </div>
          <button
            onClick={() => handleToggle('showStats')}
            disabled={saving}
            className={`px-4 py-2 rounded ${settings.showStats ? 'bg-green-600' : 'bg-gray-300'} text-white`}
          >
            {settings.showStats ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="flex justify-between items-center p-4 border rounded">
          <div>
            <h3 className="font-semibold">Show Activity</h3>
            <p className="text-sm text-gray-600">Display recent activity</p>
          </div>
          <button
            onClick={() => handleToggle('showActivity')}
            disabled={saving}
            className={`px-4 py-2 rounded ${settings.showActivity ? 'bg-green-600' : 'bg-gray-300'} text-white`}
          >
            {settings.showActivity ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="flex justify-between items-center p-4 border rounded">
          <div>
            <h3 className="font-semibold">Allow Messaging</h3>
            <p className="text-sm text-gray-600">Receive messages from users</p>
          </div>
          <button
            onClick={() => handleToggle('allowMessaging')}
            disabled={saving}
            className={`px-4 py-2 rounded ${settings.allowMessaging ? 'bg-green-600' : 'bg-gray-300'} text-white`}
          >
            {settings.allowMessaging ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="flex justify-between items-center p-4 border rounded">
          <div>
            <h3 className="font-semibold">Data Sharing</h3>
            <p className="text-sm text-gray-600">Share data for analytics</p>
          </div>
          <button
            onClick={() => handleToggle('dataSharing')}
            disabled={saving}
            className={`px-4 py-2 rounded ${settings.dataSharing ? 'bg-green-600' : 'bg-gray-300'} text-white`}
          >
            {settings.dataSharing ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}
