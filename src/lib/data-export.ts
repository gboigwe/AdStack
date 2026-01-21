/**
 * Data Export Functionality
 * Allows users to export all their data from Gaia
 */

import { getUserProfile } from './user-preferences';
import { listDrafts } from './campaign-drafts';
import { listCreatives } from './ad-creative-storage';
import { DataExport } from '../types/user-profile';
import { getIdentityAddress } from './auth';

export async function exportAllData(): Promise<DataExport> {
  const userId = getIdentityAddress();
  const profile = await getUserProfile();
  const campaigns = await listDrafts();
  const creatives = await listCreatives();

  const exportData: DataExport = {
    userId,
    exportedAt: Date.now(),
    format: 'json',
    data: {
      profile: profile!,
      campaigns,
      activities: [],
      analytics: [],
      creatives,
      messages: []
    }
  };

  return exportData;
}

export function downloadExport(exportData: DataExport, filename?: string): void {
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `adstack-export-${Date.now()}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

export default { exportAllData, downloadExport };
