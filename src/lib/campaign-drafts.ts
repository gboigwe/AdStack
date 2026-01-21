/**
 * Campaign Draft Auto-Save System
 * Automatically saves campaign drafts to Gaia storage
 */

import { putData, getData, listFiles, deleteData } from './gaia-storage';
import { getStoragePath, generateFilename } from './gaia-config';
import { CampaignDraft } from '../types/user-profile';
import { getIdentityAddress } from './auth';

// Auto-save configuration
const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const MAX_DRAFTS = 50;

// Auto-save timers
const autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();

// Create new draft
export async function createDraft(
  draftData: Omit<CampaignDraft, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'autosaveVersion'>
): Promise<CampaignDraft> {
  try {
    const userId = getIdentityAddress();
    const draftId = generateFilename('draft', 'json').replace('.json', '');

    const draft: CampaignDraft = {
      id: draftId,
      userId,
      ...draftData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      autosaveVersion: 1
    };

    const path = getStoragePath('drafts', `${draftId}.json`);
    await putData(path, draft, { encrypt: true });

    return draft;
  } catch (error) {
    console.error('Error creating draft:', error);
    throw error;
  }
}

// Get draft by ID
export async function getDraft(draftId: string): Promise<CampaignDraft | null> {
  try {
    const path = getStoragePath('drafts', `${draftId}.json`);
    const draft = await getData<CampaignDraft>(path, { decrypt: true });
    return draft;
  } catch (error) {
    console.error('Error loading draft:', error);
    return null;
  }
}

// Update draft
export async function updateDraft(
  draftId: string,
  updates: Partial<Omit<CampaignDraft, 'id' | 'userId' | 'createdAt'>>
): Promise<CampaignDraft> {
  try {
    const existingDraft = await getDraft(draftId);

    if (!existingDraft) {
      throw new Error(`Draft ${draftId} not found`);
    }

    const updatedDraft: CampaignDraft = {
      ...existingDraft,
      ...updates,
      updatedAt: Date.now(),
      autosaveVersion: existingDraft.autosaveVersion + 1
    };

    const path = getStoragePath('drafts', `${draftId}.json`);
    await putData(path, updatedDraft, { encrypt: true });

    return updatedDraft;
  } catch (error) {
    console.error('Error updating draft:', error);
    throw error;
  }
}

// Delete draft
export async function deleteDraft(draftId: string): Promise<void> {
  try {
    const path = getStoragePath('drafts', `${draftId}.json`);
    await deleteData(path);

    // Clear autosave timer if exists
    stopAutosave(draftId);
  } catch (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
}

// List all drafts
export async function listDrafts(): Promise<CampaignDraft[]> {
  try {
    const draftsPath = getStoragePath('drafts');

    const draftFiles = await listFiles((filename) => {
      return filename.startsWith(draftsPath) && filename.endsWith('.json');
    });

    const drafts: CampaignDraft[] = [];

    for (const file of draftFiles) {
      const draftData = await getData<CampaignDraft>(file, { decrypt: true });
      if (draftData) {
        drafts.push(draftData);
      }
    }

    // Sort by updated date (newest first)
    return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Error listing drafts:', error);
    return [];
  }
}

// Auto-save draft
export function startAutosave(
  draftId: string,
  getData: () => Partial<Omit<CampaignDraft, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'autosaveVersion'>>,
  onSave?: (draft: CampaignDraft) => void,
  onError?: (error: Error) => void
): void {
  // Stop existing autosave if any
  stopAutosave(draftId);

  const timer = setInterval(async () => {
    try {
      const currentData = getData();
      const updatedDraft = await updateDraft(draftId, currentData);

      if (onSave) {
        onSave(updatedDraft);
      }
    } catch (error) {
      console.error('Autosave error:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, AUTOSAVE_INTERVAL);

  autoSaveTimers.set(draftId, timer);
}

// Stop auto-save
export function stopAutosave(draftId: string): void {
  const timer = autoSaveTimers.get(draftId);

  if (timer) {
    clearInterval(timer);
    autoSaveTimers.delete(draftId);
  }
}

// Manual save (for explicit user action)
export async function saveDraft(
  draftId: string,
  data: Partial<Omit<CampaignDraft, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'autosaveVersion'>>
): Promise<CampaignDraft> {
  return await updateDraft(draftId, data);
}

// Convert draft to campaign data
export function draftToCampaignData(draft: CampaignDraft): {
  name: string;
  budget: bigint;
  fundingThreshold: bigint;
  startTime: number;
  endTime: number;
  metadata: string;
} {
  return {
    name: draft.name,
    budget: BigInt(Math.floor(parseFloat(draft.budget) * 1_000_000)),
    fundingThreshold: BigInt(Math.floor(parseFloat(draft.fundingThreshold) * 1_000_000)),
    startTime: Math.floor(new Date(draft.startDate).getTime() / 1000),
    endTime: Math.floor(new Date(draft.endDate).getTime() / 1000),
    metadata: JSON.stringify({
      description: draft.description,
      targetAudience: draft.targetAudience,
      objectives: draft.objectives,
      channels: draft.channels
    })
  };
}

// Clean up old drafts (keep only MAX_DRAFTS)
export async function cleanupOldDrafts(): Promise<void> {
  try {
    const drafts = await listDrafts();

    if (drafts.length <= MAX_DRAFTS) {
      return;
    }

    // Delete oldest drafts
    const draftsToDelete = drafts.slice(MAX_DRAFTS);

    for (const draft of draftsToDelete) {
      await deleteDraft(draft.id);
    }
  } catch (error) {
    console.error('Error cleaning up drafts:', error);
  }
}

// Duplicate draft
export async function duplicateDraft(draftId: string): Promise<CampaignDraft> {
  const existingDraft = await getDraft(draftId);

  if (!existingDraft) {
    throw new Error(`Draft ${draftId} not found`);
  }

  const newDraft = await createDraft({
    name: `${existingDraft.name} (Copy)`,
    description: existingDraft.description,
    budget: existingDraft.budget,
    fundingThreshold: existingDraft.fundingThreshold,
    startDate: existingDraft.startDate,
    endDate: existingDraft.endDate,
    targetAudience: existingDraft.targetAudience,
    objectives: existingDraft.objectives,
    channels: existingDraft.channels
  });

  return newDraft;
}

// Search drafts
export async function searchDrafts(query: string): Promise<CampaignDraft[]> {
  const drafts = await listDrafts();

  const lowerQuery = query.toLowerCase();

  return drafts.filter(draft =>
    draft.name.toLowerCase().includes(lowerQuery) ||
    draft.description.toLowerCase().includes(lowerQuery) ||
    draft.targetAudience.toLowerCase().includes(lowerQuery)
  );
}

// Get draft statistics
export async function getDraftStatistics(): Promise<{
  total: number;
  lastUpdated: number | null;
  oldestDraft: number | null;
  totalStorage: number;
}> {
  const drafts = await listDrafts();

  if (drafts.length === 0) {
    return {
      total: 0,
      lastUpdated: null,
      oldestDraft: null,
      totalStorage: 0
    };
  }

  const lastUpdated = Math.max(...drafts.map(d => d.updatedAt));
  const oldestDraft = Math.min(...drafts.map(d => d.createdAt));
  const totalStorage = drafts.reduce((sum, draft) => {
    return sum + JSON.stringify(draft).length;
  }, 0);

  return {
    total: drafts.length,
    lastUpdated,
    oldestDraft,
    totalStorage
  };
}

// Export all functions
export const campaignDrafts = {
  createDraft,
  getDraft,
  updateDraft,
  deleteDraft,
  listDrafts,
  startAutosave,
  stopAutosave,
  saveDraft,
  draftToCampaignData,
  cleanupOldDrafts,
  duplicateDraft,
  searchDrafts,
  getDraftStatistics
};

export default campaignDrafts;
