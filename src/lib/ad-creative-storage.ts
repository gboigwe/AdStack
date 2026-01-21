/**
 * Ad Creative Storage System
 * Manages storing and retrieving ad creatives from Gaia
 */

import { putData, getData, listFiles, deleteData } from './gaia-storage';
import { getStoragePath, generateFilename } from './gaia-config';
import { AdCreative } from '../types/user-profile';
import { getIdentityAddress } from './auth';

export async function saveCreative(creative: Omit<AdCreative, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<AdCreative> {
  const userId = getIdentityAddress();
  const creativeId = generateFilename('creative', 'json').replace('.json', '');

  const newCreative: AdCreative = {
    id: creativeId,
    userId,
    ...creative,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const path = getStoragePath('creatives', `${creativeId}.json`);
  await putData(path, newCreative, { encrypt: false });

  return newCreative;
}

export async function getCreative(creativeId: string): Promise<AdCreative | null> {
  const path = getStoragePath('creatives', `${creativeId}.json`);
  return await getData<AdCreative>(path, { decrypt: false });
}

export async function listCreatives(): Promise<AdCreative[]> {
  const creativesPath = getStoragePath('creatives');
  const creativeFiles = await listFiles((filename) =>
    filename.startsWith(creativesPath) && filename.endsWith('.json')
  );

  const creatives: AdCreative[] = [];
  for (const file of creativeFiles) {
    const creative = await getData<AdCreative>(file, { decrypt: false });
    if (creative) creatives.push(creative);
  }

  return creatives.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteCreative(creativeId: string): Promise<void> {
  const path = getStoragePath('creatives', `${creativeId}.json`);
  await deleteData(path);
}

export default { saveCreative, getCreative, listCreatives, deleteCreative };
