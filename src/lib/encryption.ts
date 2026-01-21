/**
 * Encrypted Data Storage Utilities
 * Provides encryption/decryption for sensitive user data
 */

import { encryptContent, decryptContent } from '@stacks/encryption';
import { getAppPrivateKey } from './auth';

// Encryption options
export interface EncryptionOptions {
  publicKey?: string;
  privateKey?: string;
  wasString?: boolean;
}

// Encrypt data using user's app private key
export async function encryptData<T>(
  data: T,
  options?: EncryptionOptions
): Promise<string> {
  try {
    const privateKey = options?.privateKey || getAppPrivateKey();

    const jsonData = JSON.stringify(data);

    const encrypted = await encryptContent(jsonData, {
      privateKey,
      wasString: options?.wasString ?? true
    });

    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt data using user's app private key
export async function decryptData<T>(
  encryptedData: string,
  options?: EncryptionOptions
): Promise<T> {
  try {
    const privateKey = options?.privateKey || getAppPrivateKey();

    const decrypted = await decryptContent(encryptedData, {
      privateKey
    });

    if (typeof decrypted === 'string') {
      return JSON.parse(decrypted) as T;
    }

    return decrypted as T;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Encrypt string
export async function encryptString(
  text: string,
  options?: EncryptionOptions
): Promise<string> {
  try {
    const privateKey = options?.privateKey || getAppPrivateKey();

    const encrypted = await encryptContent(text, {
      privateKey,
      wasString: true
    });

    return encrypted;
  } catch (error) {
    console.error('String encryption error:', error);
    throw new Error('Failed to encrypt string');
  }
}

// Decrypt string
export async function decryptString(
  encryptedText: string,
  options?: EncryptionOptions
): Promise<string> {
  try {
    const privateKey = options?.privateKey || getAppPrivateKey();

    const decrypted = await decryptContent(encryptedText, {
      privateKey
    });

    return decrypted as string;
  } catch (error) {
    console.error('String decryption error:', error);
    throw new Error('Failed to decrypt string');
  }
}

// Encrypt file content
export async function encryptFile(
  fileContent: string | ArrayBuffer,
  options?: EncryptionOptions
): Promise<string> {
  try {
    const privateKey = options?.privateKey || getAppPrivateKey();

    let content: string;

    if (fileContent instanceof ArrayBuffer) {
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(fileContent);
      content = btoa(String.fromCharCode(...bytes));
    } else {
      content = fileContent;
    }

    const encrypted = await encryptContent(content, {
      privateKey,
      wasString: true
    });

    return encrypted;
  } catch (error) {
    console.error('File encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
}

// Decrypt file content
export async function decryptFile(
  encryptedContent: string,
  options?: EncryptionOptions & { returnBuffer?: boolean }
): Promise<string | ArrayBuffer> {
  try {
    const privateKey = options?.privateKey || getAppPrivateKey();

    const decrypted = await decryptContent(encryptedContent, {
      privateKey
    });

    if (options?.returnBuffer) {
      // Convert base64 to ArrayBuffer
      const binaryString = atob(decrypted as string);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }

    return decrypted as string;
  } catch (error) {
    console.error('File decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
}

// Hash data (for integrity checks)
export async function hashData(data: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Fallback for non-browser environments
    return btoa(data);
  }

  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash data');
  }
}

// Verify data integrity
export async function verifyDataIntegrity(
  data: string,
  expectedHash: string
): Promise<boolean> {
  try {
    const actualHash = await hashData(data);
    return actualHash === expectedHash;
  } catch (error) {
    console.error('Integrity verification error:', error);
    return false;
  }
}

// Generate random encryption key
export function generateEncryptionKey(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for non-browser
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Encrypt with password (for user-provided encryption)
export async function encryptWithPassword(
  data: string,
  password: string
): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API not available');
  }

  try {
    const encoder = new TextEncoder();

    // Derive key from password
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = window.crypto.getRandomValues(new Uint8Array(16));

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Encrypt data
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    // Combine salt, iv, and encrypted data
    const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encryptedData), salt.length + iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...result));
  } catch (error) {
    console.error('Password encryption error:', error);
    throw new Error('Failed to encrypt with password');
  }
}

// Decrypt with password
export async function decryptWithPassword(
  encryptedData: string,
  password: string
): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API not available');
  }

  try {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    // Decode base64
    const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract salt, iv, and encrypted data
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);

    // Derive key from password
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // Decrypt data
    const decryptedData = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Password decryption error:', error);
    throw new Error('Failed to decrypt with password');
  }
}

// Export all functions
export const encryption = {
  encryptData,
  decryptData,
  encryptString,
  decryptString,
  encryptFile,
  decryptFile,
  hashData,
  verifyDataIntegrity,
  generateEncryptionKey,
  encryptWithPassword,
  decryptWithPassword
};

export default encryption;
