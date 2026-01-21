/**
 * User Preferences Management
 * Handles storing and retrieving user preferences from Gaia
 */

import { putData, getData } from './gaia-storage';
import { getStoragePath } from './gaia-config';
import {
  UserProfile,
  UserPreferences,
  DEFAULT_USER_PREFERENCES,
  DEFAULT_USER_STATS
} from '../types/user-profile';
import { getIdentityAddress, getUsername } from './auth';

// Get user profile
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const path = getStoragePath('profile');
    const profile = await getData<UserProfile>(path, { decrypt: true });
    return profile;
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
}

// Create or update user profile
export async function saveUserProfile(
  profile: Partial<UserProfile>
): Promise<string> {
  try {
    const existingProfile = await getUserProfile();
    const identityAddress = getIdentityAddress();
    const username = getUsername() || identityAddress;

    const updatedProfile: UserProfile = {
      id: existingProfile?.id || identityAddress,
      username: profile.username || existingProfile?.username || username,
      displayName: profile.displayName || existingProfile?.displayName || username,
      email: profile.email || existingProfile?.email,
      avatar: profile.avatar || existingProfile?.avatar,
      bio: profile.bio || existingProfile?.bio,
      website: profile.website || existingProfile?.website,
      location: profile.location || existingProfile?.location,
      createdAt: existingProfile?.createdAt || Date.now(),
      updatedAt: Date.now(),
      preferences: profile.preferences || existingProfile?.preferences || DEFAULT_USER_PREFERENCES,
      stats: profile.stats || existingProfile?.stats || DEFAULT_USER_STATS
    };

    const path = getStoragePath('profile');
    const url = await putData(path, updatedProfile, { encrypt: true });

    return url;
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
}

// Get user preferences
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const profile = await getUserProfile();

    if (!profile || !profile.preferences) {
      return DEFAULT_USER_PREFERENCES;
    }

    return profile.preferences;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return DEFAULT_USER_PREFERENCES;
  }
}

// Update user preferences
export async function updateUserPreferences(
  preferences: Partial<UserPreferences>
): Promise<string> {
  try {
    const profile = await getUserProfile();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const updatedPreferences: UserPreferences = {
      ...profile.preferences,
      ...preferences
    };

    return await saveUserProfile({
      ...profile,
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
}

// Update specific preference sections
export async function updateTheme(
  theme: 'light' | 'dark' | 'system'
): Promise<string> {
  const preferences = await getUserPreferences();
  return await updateUserPreferences({
    ...preferences,
    theme
  });
}

export async function updateLanguage(language: string): Promise<string> {
  const preferences = await getUserPreferences();
  return await updateUserPreferences({
    ...preferences,
    language
  });
}

export async function updateCurrency(
  currency: 'STX' | 'USD' | 'EUR'
): Promise<string> {
  const preferences = await getUserPreferences();
  return await updateUserPreferences({
    ...preferences,
    currency
  });
}

export async function updateNotificationPreferences(
  notifications: Partial<UserPreferences['notifications']>
): Promise<string> {
  const preferences = await getUserPreferences();
  return await updateUserPreferences({
    ...preferences,
    notifications: {
      ...preferences.notifications,
      ...notifications
    }
  });
}

export async function updatePrivacySettings(
  privacy: Partial<UserPreferences['privacy']>
): Promise<string> {
  const preferences = await getUserPreferences();
  return await updateUserPreferences({
    ...preferences,
    privacy: {
      ...preferences.privacy,
      ...privacy
    }
  });
}

// Update user stats
export async function updateUserStats(
  stats: Partial<UserProfile['stats']>
): Promise<string> {
  try {
    const profile = await getUserProfile();

    if (!profile) {
      throw new Error('Profile not found');
    }

    const updatedStats = {
      ...profile.stats,
      ...stats
    };

    return await saveUserProfile({
      ...profile,
      stats: updatedStats
    });
  } catch (error) {
    console.error('Error updating stats:', error);
    throw error;
  }
}

// Increment campaign count
export async function incrementCampaignCount(): Promise<string> {
  const profile = await getUserProfile();

  if (!profile) {
    throw new Error('Profile not found');
  }

  return await updateUserStats({
    totalCampaigns: profile.stats.totalCampaigns + 1,
    activeCampaigns: profile.stats.activeCampaigns + 1
  });
}

// Decrement active campaign count
export async function decrementActiveCampaignCount(): Promise<string> {
  const profile = await getUserProfile();

  if (!profile) {
    throw new Error('Profile not found');
  }

  return await updateUserStats({
    activeCampaigns: Math.max(0, profile.stats.activeCampaigns - 1)
  });
}

// Update spending and revenue
export async function updateFinancialStats(
  spent?: string,
  revenue?: string
): Promise<string> {
  const profile = await getUserProfile();

  if (!profile) {
    throw new Error('Profile not found');
  }

  const updates: Partial<UserProfile['stats']> = {};

  if (spent) {
    const currentSpent = BigInt(profile.stats.totalSpent);
    const additionalSpent = BigInt(spent);
    updates.totalSpent = (currentSpent + additionalSpent).toString();
  }

  if (revenue) {
    const currentRevenue = BigInt(profile.stats.totalRevenue);
    const additionalRevenue = BigInt(revenue);
    updates.totalRevenue = (currentRevenue + additionalRevenue).toString();
  }

  // Calculate new ROI
  if (updates.totalSpent || updates.totalRevenue) {
    const totalSpent = BigInt(updates.totalSpent || profile.stats.totalSpent);
    const totalRevenue = BigInt(updates.totalRevenue || profile.stats.totalRevenue);

    if (totalSpent > 0n) {
      const roi = Number((totalRevenue - totalSpent) * 10000n / totalSpent);
      updates.averageROI = roi;
    }
  }

  return await updateUserStats(updates);
}

// Increment milestones achieved
export async function incrementMilestonesAchieved(): Promise<string> {
  const profile = await getUserProfile();

  if (!profile) {
    throw new Error('Profile not found');
  }

  return await updateUserStats({
    milestonesAchieved: profile.stats.milestonesAchieved + 1
  });
}

// Update reputation score
export async function updateReputationScore(score: number): Promise<string> {
  return await updateUserStats({
    reputationScore: score
  });
}

// Initialize user profile (for first-time users)
export async function initializeUserProfile(): Promise<string> {
  const identityAddress = getIdentityAddress();
  const username = getUsername() || identityAddress;

  const profile: UserProfile = {
    id: identityAddress,
    username,
    displayName: username,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    preferences: DEFAULT_USER_PREFERENCES,
    stats: DEFAULT_USER_STATS
  };

  const path = getStoragePath('profile');
  const url = await putData(path, profile, { encrypt: true });

  return url;
}

// Check if profile exists
export async function profileExists(): Promise<boolean> {
  try {
    const profile = await getUserProfile();
    return profile !== null;
  } catch (error) {
    return false;
  }
}

// Export all functions
export const userPreferences = {
  getUserProfile,
  saveUserProfile,
  getUserPreferences,
  updateUserPreferences,
  updateTheme,
  updateLanguage,
  updateCurrency,
  updateNotificationPreferences,
  updatePrivacySettings,
  updateUserStats,
  incrementCampaignCount,
  decrementActiveCampaignCount,
  updateFinancialStats,
  incrementMilestonesAchieved,
  updateReputationScore,
  initializeUserProfile,
  profileExists
};

export default userPreferences;
