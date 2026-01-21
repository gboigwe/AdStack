/**
 * User Profile Data Schema
 * Defines structure for decentralized user data stored in Gaia
 */

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  createdAt: number;
  updatedAt: number;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: 'STX' | 'USD' | 'EUR';
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  defaultNetwork: 'mainnet' | 'testnet';
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  campaignUpdates: boolean;
  payoutAlerts: boolean;
  milestoneAchievements: boolean;
  systemAnnouncements: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'connections';
  showStats: boolean;
  showActivity: boolean;
  allowMessaging: boolean;
  dataSharing: boolean;
}

export interface UserStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpent: string;
  totalRevenue: string;
  averageROI: number;
  milestonesAchieved: number;
  reputationScore: number;
}

export interface CampaignDraft {
  id: string;
  userId: string;
  name: string;
  description: string;
  budget: string;
  fundingThreshold: string;
  startDate: string;
  endDate: string;
  targetAudience: string;
  objectives: string[];
  channels: string[];
  createdAt: number;
  updatedAt: number;
  autosaveVersion: number;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: ActivityType;
  description: string;
  metadata: Record<string, any>;
  timestamp: number;
}

export type ActivityType =
  | 'campaign_created'
  | 'campaign_funded'
  | 'campaign_activated'
  | 'campaign_completed'
  | 'milestone_achieved'
  | 'payout_received'
  | 'escrow_released'
  | 'profile_updated'
  | 'preferences_changed';

export interface UploadedFile {
  id: string;
  userId: string;
  filename: string;
  mimeType: string;
  size: number;
  gaiaUrl: string;
  encrypted: boolean;
  uploadedAt: number;
  metadata?: Record<string, any>;
}

export interface AdCreative {
  id: string;
  userId: string;
  campaignId?: string;
  name: string;
  description: string;
  type: 'image' | 'video' | 'html' | 'text';
  fileUrl?: string;
  content?: string;
  width?: number;
  height?: number;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface UserAnalytics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: string;
  metrics: {
    campaignsCreated: number;
    totalSpent: string;
    totalRevenue: string;
    averageCTR: number;
    averageCVR: number;
    averageROI: number;
    impressions: number;
    clicks: number;
    conversions: number;
  };
}

export interface PrivateMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  encrypted: boolean;
  read: boolean;
  sentAt: number;
  readAt?: number;
  threadId?: string;
}

export interface DataExport {
  userId: string;
  exportedAt: number;
  format: 'json' | 'csv';
  data: {
    profile: UserProfile;
    campaigns: CampaignDraft[];
    activities: UserActivity[];
    analytics: UserAnalytics[];
    creatives: AdCreative[];
    messages: PrivateMessage[];
  };
}

// Type guards
export function isUserProfile(obj: any): obj is UserProfile {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.username === 'string' &&
    typeof obj.createdAt === 'number' &&
    obj.preferences &&
    obj.stats
  );
}

export function isCampaignDraft(obj: any): obj is CampaignDraft {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.createdAt === 'number'
  );
}

// Default values
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'en',
  currency: 'STX',
  notifications: {
    email: true,
    push: true,
    campaignUpdates: true,
    payoutAlerts: true,
    milestoneAchievements: true,
    systemAnnouncements: true
  },
  privacy: {
    profileVisibility: 'public',
    showStats: true,
    showActivity: true,
    allowMessaging: true,
    dataSharing: false
  },
  defaultNetwork: 'mainnet'
};

export const DEFAULT_USER_STATS: UserStats = {
  totalCampaigns: 0,
  activeCampaigns: 0,
  totalSpent: '0',
  totalRevenue: '0',
  averageROI: 0,
  milestonesAchieved: 0,
  reputationScore: 0
};
