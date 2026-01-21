/**
 * File Upload to Gaia
 * Handles uploading files and media to decentralized storage
 */

import { uploadFile as gaiaUploadFile } from './gaia-storage';
import { getStoragePath, FILE_SIZE_LIMITS, generateFilename } from './gaia-config';
import { UploadedFile } from '../types/user-profile';
import { getIdentityAddress } from './auth';

export async function uploadFileToGaia(
  file: File,
  options?: {
    folder?: 'uploads' | 'creatives';
    encrypt?: boolean;
    onProgress?: (progress: number) => void;
  }
): Promise<UploadedFile> {
  const userId = getIdentityAddress();
  const folder = options?.folder || 'uploads';
  const filename = generateFilename(file.name.split('.')[0], file.name.split('.').pop() || 'bin');
  const path = getStoragePath(folder, filename);

  const url = await gaiaUploadFile(file, path, {
    encrypt: options?.encrypt ?? false,
    maxSize: FILE_SIZE_LIMITS.upload
  });

  const uploadedFile: UploadedFile = {
    id: filename,
    userId,
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    gaiaUrl: url,
    encrypted: options?.encrypt ?? false,
    uploadedAt: Date.now()
  };

  return uploadedFile;
}

export default { uploadFileToGaia };
