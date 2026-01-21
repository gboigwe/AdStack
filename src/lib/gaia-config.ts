/**
 * Gaia Hub Configuration
 * Configures decentralized storage for user data
 */

import { Storage } from '@stacks/storage';

// Gaia Hub Configuration
export const GAIA_HUB_CONFIG = {
  // Default Gaia hub (Hiro's public hub)
  hubUrl: process.env.NEXT_PUBLIC_GAIA_HUB_URL || 'https://hub.blockstack.org',

  // Fallback hubs
  fallbackHubs: [
    'https://gaia.blockstack.org',
    'https://hub.blockstack.xyz'
  ],

  // Storage options
  gaiaHubConfig: {
    address: '',
    url_prefix: '',
    token: '',
    server: process.env.NEXT_PUBLIC_GAIA_HUB_URL || 'https://hub.blockstack.org'
  }
};

// Storage paths for different data types
export const STORAGE_PATHS = {
  profile: 'profile.json',
  preferences: 'preferences.json',
  campaigns: 'campaigns/',
  drafts: 'drafts/',
  creatives: 'creatives/',
  analytics: 'analytics/',
  messages: 'messages/',
  uploads: 'uploads/',
  exports: 'exports/'
} as const;

// Storage options
export const STORAGE_OPTIONS = {
  encrypt: true,
  dangerouslyIgnoreEtag: false,
  contentType: 'application/json',
  cipherTextEncoding: 'hex' as const
};

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  profile: 100 * 1024, // 100 KB
  preferences: 50 * 1024, // 50 KB
  draft: 500 * 1024, // 500 KB
  creative: 10 * 1024 * 1024, // 10 MB
  upload: 25 * 1024 * 1024, // 25 MB
  export: 50 * 1024 * 1024 // 50 MB
};

// Initialize Storage instance
let storageInstance: Storage | null = null;

export function getStorageInstance(): Storage {
  if (!storageInstance) {
    storageInstance = new Storage({
      userSession: undefined // Will be set when user authenticates
    });
  }
  return storageInstance;
}

export function setStorageUserSession(userSession: any) {
  storageInstance = new Storage({ userSession });
}

// Helper to get full storage path
export function getStoragePath(
  type: keyof typeof STORAGE_PATHS,
  filename?: string
): string {
  const basePath = STORAGE_PATHS[type];
  if (filename) {
    return `${basePath}${filename}`;
  }
  return basePath;
}

// Validate file size
export function validateFileSize(
  size: number,
  type: keyof typeof FILE_SIZE_LIMITS
): boolean {
  return size <= FILE_SIZE_LIMITS[type];
}

// Generate unique filename
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}.${extension}`;
}

// Parse Gaia URL
export function parseGaiaUrl(url: string): {
  hubUrl: string;
  address: string;
  filename: string;
} | null {
  try {
    const parts = url.split('/');
    if (parts.length < 3) return null;

    const filename = parts[parts.length - 1];
    const address = parts[parts.length - 2];
    const hubUrl = parts.slice(0, parts.length - 2).join('/');

    return { hubUrl, address, filename };
  } catch (error) {
    console.error('Error parsing Gaia URL:', error);
    return null;
  }
}

// Check if Gaia hub is accessible
export async function checkGaiaHubHealth(hubUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${hubUrl}/hub_info`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.error('Gaia hub health check failed:', error);
    return false;
  }
}

// Get available Gaia hub
export async function getAvailableGaiaHub(): Promise<string> {
  // Check primary hub
  const primaryHealthy = await checkGaiaHubHealth(GAIA_HUB_CONFIG.hubUrl);
  if (primaryHealthy) {
    return GAIA_HUB_CONFIG.hubUrl;
  }

  // Check fallback hubs
  for (const fallbackHub of GAIA_HUB_CONFIG.fallbackHubs) {
    const fallbackHealthy = await checkGaiaHubHealth(fallbackHub);
    if (fallbackHealthy) {
      return fallbackHub;
    }
  }

  // Return primary as last resort
  return GAIA_HUB_CONFIG.hubUrl;
}

// Content type detection
export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    json: 'application/json',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
    zip: 'application/zip'
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

// Error handling
export class GaiaError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GaiaError';
  }
}

export const GAIA_ERROR_CODES = {
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  DOWNLOAD_FAILED: 'DOWNLOAD_FAILED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  HUB_UNAVAILABLE: 'HUB_UNAVAILABLE',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED'
} as const;
