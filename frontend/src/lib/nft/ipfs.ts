/**
 * IPFS Integration for AdStack NFT System
 * Handles uploading media and metadata to IPFS
 */

export interface IPFSUploadResult {
  ipfsHash: string;
  url: string;
  size: number;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  background_color?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    category: string;
    tags: string[];
    license_type: string;
    commercial_use: boolean;
    media_type: string;
    creator: string;
    created_at: number;
  };
}

/**
 * IPFS Gateway URLs
 */
const IPFS_GATEWAYS = {
  primary: 'https://ipfs.io/ipfs/',
  fallback: 'https://cloudflare-ipfs.com/ipfs/',
  pinata: 'https://gateway.pinata.cloud/ipfs/',
} as const;

/**
 * Upload a file to IPFS
 * In production, this should use a service like Pinata, NFT.Storage, or Web3.Storage
 */
export async function uploadFileToIPFS(file: File): Promise<IPFSUploadResult> {
  try {
    // TODO: Replace with actual IPFS upload
    // For now, return mock data
    const mockHash = generateMockIPFSHash();

    console.log('Uploading file to IPFS:', {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Simulate upload delay
    await delay(1500);

    return {
      ipfsHash: mockHash,
      url: `${IPFS_GATEWAYS.primary}${mockHash}`,
      size: file.size,
    };
  } catch (error) {
    console.error('IPFS upload failed:', error);
    throw new Error('Failed to upload file to IPFS');
  }
}

/**
 * Upload JSON metadata to IPFS
 */
export async function uploadMetadataToIPFS(metadata: NFTMetadata): Promise<IPFSUploadResult> {
  try {
    const metadataString = JSON.stringify(metadata, null, 2);
    const metadataBlob = new Blob([metadataString], { type: 'application/json' });

    // TODO: Replace with actual IPFS upload
    const mockHash = generateMockIPFSHash();

    console.log('Uploading metadata to IPFS:', metadata);

    // Simulate upload delay
    await delay(1000);

    return {
      ipfsHash: mockHash,
      url: `${IPFS_GATEWAYS.primary}${mockHash}`,
      size: metadataBlob.size,
    };
  } catch (error) {
    console.error('Metadata upload failed:', error);
    throw new Error('Failed to upload metadata to IPFS');
  }
}

/**
 * Upload both file and metadata to IPFS
 * Returns the metadata URI with embedded image hash
 */
export async function uploadNFTToIPFS(
  file: File,
  metadata: Omit<NFTMetadata, 'image'>
): Promise<{ metadataUri: string; imageHash: string; metadataHash: string }> {
  try {
    // First upload the file
    const fileResult = await uploadFileToIPFS(file);

    // Create complete metadata with image hash
    const completeMetadata: NFTMetadata = {
      ...metadata,
      image: `ipfs://${fileResult.ipfsHash}`,
    };

    // Upload metadata
    const metadataResult = await uploadMetadataToIPFS(completeMetadata);

    return {
      metadataUri: `ipfs://${metadataResult.ipfsHash}`,
      imageHash: fileResult.ipfsHash,
      metadataHash: metadataResult.ipfsHash,
    };
  } catch (error) {
    console.error('NFT upload failed:', error);
    throw new Error('Failed to upload NFT to IPFS');
  }
}

/**
 * Retrieve data from IPFS hash
 */
export async function fetchFromIPFS(ipfsHash: string): Promise<any> {
  const gateways = Object.values(IPFS_GATEWAYS);

  for (const gateway of gateways) {
    try {
      const url = `${gateway}${ipfsHash}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          return await response.json();
        }

        return await response.blob();
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${gateway}:`, error);
      continue;
    }
  }

  throw new Error(`Failed to fetch from IPFS: ${ipfsHash}`);
}

/**
 * Convert IPFS URI to HTTP URL
 */
export function ipfsToHttpUrl(ipfsUri: string, gateway: keyof typeof IPFS_GATEWAYS = 'primary'): string {
  if (!ipfsUri) return '';

  // Handle ipfs:// protocol
  if (ipfsUri.startsWith('ipfs://')) {
    const hash = ipfsUri.replace('ipfs://', '');
    return `${IPFS_GATEWAYS[gateway]}${hash}`;
  }

  // Handle plain hash
  if (!ipfsUri.startsWith('http')) {
    return `${IPFS_GATEWAYS[gateway]}${ipfsUri}`;
  }

  // Already HTTP URL
  return ipfsUri;
}

/**
 * Validate IPFS hash format
 */
export function isValidIPFSHash(hash: string): boolean {
  // CIDv0: Qm followed by 44 base58 characters
  const cidV0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;

  // CIDv1: b followed by base32 characters
  const cidV1Regex = /^b[a-z2-7]{58,}$/;

  return cidV0Regex.test(hash) || cidV1Regex.test(hash);
}

/**
 * Pin file to IPFS (keep it available)
 */
export async function pinToIPFS(ipfsHash: string): Promise<boolean> {
  try {
    // TODO: Implement pinning via Pinata or similar service
    console.log('Pinning to IPFS:', ipfsHash);

    await delay(500);

    return true;
  } catch (error) {
    console.error('Pinning failed:', error);
    return false;
  }
}

/**
 * Unpin file from IPFS
 */
export async function unpinFromIPFS(ipfsHash: string): Promise<boolean> {
  try {
    // TODO: Implement unpinning
    console.log('Unpinning from IPFS:', ipfsHash);

    await delay(500);

    return true;
  } catch (error) {
    console.error('Unpinning failed:', error);
    return false;
  }
}

/**
 * Get pinned status
 */
export async function isPinned(ipfsHash: string): Promise<boolean> {
  try {
    // TODO: Check pinning status
    console.log('Checking pin status:', ipfsHash);

    return true; // Mock: assume pinned
  } catch (error) {
    console.error('Pin status check failed:', error);
    return false;
  }
}

/**
 * Build complete NFT metadata object
 */
export function buildNFTMetadata(params: {
  name: string;
  description: string;
  imageHash: string;
  category: string;
  tags: string[];
  licenseType: string;
  commercialUse: boolean;
  mediaType: string;
  creator: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  externalUrl?: string;
  backgroundColor?: string;
}): NFTMetadata {
  return {
    name: params.name,
    description: params.description,
    image: `ipfs://${params.imageHash}`,
    external_url: params.externalUrl,
    background_color: params.backgroundColor,
    attributes: params.attributes || [],
    properties: {
      category: params.category,
      tags: params.tags,
      license_type: params.licenseType,
      commercial_use: params.commercialUse,
      media_type: params.mediaType,
      creator: params.creator,
      created_at: Date.now(),
    },
  };
}

// Helper functions

function generateMockIPFSHash(): string {
  // Generate a mock CIDv0 hash (Qm...)
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let hash = 'Qm';
  for (let i = 0; i < 44; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
