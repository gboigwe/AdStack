/**
 * User Analytics Storage
 * Stores user analytics data in Gaia for historical tracking
 */

import { putData, getData } from './gaia-storage';
import { getStoragePath } from './gaia-config';
import { UserAnalytics } from '../types/user-profile';
import { getIdentityAddress } from './auth';

export async function saveAnalytics(
  period: 'daily' | 'weekly' | 'monthly',
  date: string,
  metrics: UserAnalytics['metrics']
): Promise<void> {
  const userId = getIdentityAddress();

  const analytics: UserAnalytics = {
    userId,
    period,
    date,
    metrics
  };

  const path = getStoragePath('analytics', `${period}_${date}.json`);
  await putData(path, analytics, { encrypt: true });
}

export async function getAnalytics(
  period: 'daily' | 'weekly' | 'monthly',
  date: string
): Promise<UserAnalytics | null> {
  const path = getStoragePath('analytics', `${period}_${date}.json`);
  return await getData<UserAnalytics>(path, { decrypt: true });
}

export default { saveAnalytics, getAnalytics };
