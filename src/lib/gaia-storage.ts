/**
 * Gaia Storage Abstraction Layer
 * Provides high-level API for storing and retrieving data from Gaia
 */

import { Storage } from '@stacks/storage';
import { getUserSession } from './auth';
import {
  STORAGE_OPTIONS,
  getStoragePath,
  validateFileSize,
  GaiaError,
  GAIA_ERROR_CODES
} from './gaia-config';

// Initialize storage
function getStorage(): Storage {
  const userSession = getUserSession();

  if (!userSession.isUserSignedIn()) {
    throw new GaiaError(
      'User not authenticated',
      GAIA_ERROR_CODES.NOT_AUTHENTICATED
    );
  }

  return new Storage({ userSession });
}

// Generic storage operations
export async function putData<T>(
  path: string,
  data: T,
  options?: {
    encrypt?: boolean;
    contentType?: string;
  }
): Promise<string> {
  try {
    const storage = getStorage();

    const storageOptions = {
      ...STORAGE_OPTIONS,
      encrypt: options?.encrypt ?? STORAGE_OPTIONS.encrypt,
      contentType: options?.contentType || STORAGE_OPTIONS.contentType
    };

    const jsonData = JSON.stringify(data);

    const url = await storage.putFile(path, jsonData, storageOptions);

    return url;
  } catch (error: any) {
    throw new GaiaError(
      'Failed to store data',
      GAIA_ERROR_CODES.UPLOAD_FAILED,
      error
    );
  }
}

export async function getData<T>(
  path: string,
  options?: {
    decrypt?: boolean;
    username?: string;
    zoneFileLookupURL?: string;
  }
): Promise<T | null> {
  try {
    const storage = getStorage();

    const storageOptions = {
      decrypt: options?.decrypt ?? STORAGE_OPTIONS.encrypt,
      username: options?.username,
      zoneFileLookupURL: options?.zoneFileLookupURL
    };

    const fileContent = await storage.getFile(path, storageOptions);

    if (!fileContent) {
      return null;
    }

    const content = typeof fileContent === 'string' ? fileContent : fileContent.toString();
    return JSON.parse(content) as T;
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      return null;
    }

    throw new GaiaError(
      'Failed to retrieve data',
      GAIA_ERROR_CODES.DOWNLOAD_FAILED,
      error
    );
  }
}

export async function deleteData(path: string): Promise<void> {
  try {
    const storage = getStorage();
    await storage.deleteFile(path);
  } catch (error: any) {
    throw new GaiaError(
      'Failed to delete data',
      GAIA_ERROR_CODES.UPLOAD_FAILED,
      error
    );
  }
}

export async function listFiles(
  callback: (filename: string) => boolean
): Promise<string[]> {
  try {
    const storage = getStorage();
    const files: string[] = [];

    await storage.listFiles(filename => {
      if (callback(filename)) {
        files.push(filename);
      }
      return true;
    });

    return files;
  } catch (error: any) {
    throw new GaiaError(
      'Failed to list files',
      GAIA_ERROR_CODES.DOWNLOAD_FAILED,
      error
    );
  }
}

// File upload with validation
export async function uploadFile(
  file: File,
  path: string,
  options?: {
    encrypt?: boolean;
    maxSize?: number;
  }
): Promise<string> {
  // Validate file size
  const maxSize = options?.maxSize || 25 * 1024 * 1024; // 25MB default
  if (file.size > maxSize) {
    throw new GaiaError(
      `File size ${file.size} exceeds maximum ${maxSize}`,
      GAIA_ERROR_CODES.FILE_TOO_LARGE
    );
  }

  try {
    const storage = getStorage();

    const storageOptions = {
      ...STORAGE_OPTIONS,
      encrypt: options?.encrypt ?? false,
      contentType: file.type
    };

    // Read file as text/binary
    const fileContent = await readFileContent(file);

    const url = await storage.putFile(path, fileContent, storageOptions);

    return url;
  } catch (error: any) {
    throw new GaiaError(
      'Failed to upload file',
      GAIA_ERROR_CODES.UPLOAD_FAILED,
      error
    );
  }
}

// Helper to read file content
function readFileContent(file: File): Promise<string | ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('File reading error'));
    };

    // Read as text for JSON/text files, binary for others
    if (file.type.includes('text') || file.type.includes('json')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}

// Download file from Gaia
export async function downloadFile(
  path: string,
  options?: {
    decrypt?: boolean;
  }
): Promise<Blob | null> {
  try {
    const storage = getStorage();

    const storageOptions = {
      decrypt: options?.decrypt ?? false
    };

    const fileContent = await storage.getFile(path, storageOptions);

    if (!fileContent) {
      return null;
    }

    // Convert to Blob
    if (fileContent instanceof ArrayBuffer) {
      return new Blob([fileContent]);
    } else if (typeof fileContent === 'string') {
      return new Blob([fileContent], { type: 'text/plain' });
    } else {
      return new Blob([fileContent]);
    }
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      return null;
    }

    throw new GaiaError(
      'Failed to download file',
      GAIA_ERROR_CODES.DOWNLOAD_FAILED,
      error
    );
  }
}

// Batch operations
export async function putBatch<T>(
  items: Array<{ path: string; data: T }>,
  options?: {
    encrypt?: boolean;
  }
): Promise<string[]> {
  const urls: string[] = [];

  for (const item of items) {
    const url = await putData(item.path, item.data, options);
    urls.push(url);
  }

  return urls;
}

export async function getBatch<T>(
  paths: string[],
  options?: {
    decrypt?: boolean;
  }
): Promise<Array<T | null>> {
  const results: Array<T | null> = [];

  for (const path of paths) {
    const data = await getData<T>(path, options);
    results.push(data);
  }

  return results;
}

// Check if file exists
export async function fileExists(path: string): Promise<boolean> {
  try {
    const data = await getData(path);
    return data !== null;
  } catch (error) {
    return false;
  }
}

// Get file metadata
export async function getFileMetadata(
  path: string
): Promise<{
  exists: boolean;
  size?: number;
  lastModified?: number;
} | null> {
  try {
    const fileContent = await getData(path);

    if (!fileContent) {
      return { exists: false };
    }

    const size = JSON.stringify(fileContent).length;

    return {
      exists: true,
      size,
      lastModified: Date.now()
    };
  } catch (error) {
    return null;
  }
}

// Export all functions
export const gaiaStorage = {
  putData,
  getData,
  deleteData,
  listFiles,
  uploadFile,
  downloadFile,
  putBatch,
  getBatch,
  fileExists,
  getFileMetadata
};

export default gaiaStorage;
