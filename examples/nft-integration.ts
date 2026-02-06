/**
 * NFT Integration Examples for AdStack
 *
 * This file demonstrates how to integrate the NFT system
 * into your advertising campaigns and workflows.
 */

import {
  CreativeMintingUI,
  MarketplaceGallery,
  NFTMetadataEditor,
  CreativeLicenseManager,
  NFTTransferInterface,
  NFTCollectionViewer,
  ImpressionShowcase,
  RoyaltyCalculator,
} from '@/components/nft';

import {
  uploadFileToIPFS,
  uploadMetadataToIPFS,
  uploadNFTToIPFS,
  ipfsToHttpUrl,
  buildNFTMetadata,
} from '@/lib/nft/ipfs';

import {
  mintCreativeNFT,
  listForSale,
  buyNFT,
  getCreativeInfo,
  calculateRoyalty,
  mintImpressionProof,
  getTierThresholds,
} from '@/lib/nft/contracts';

// =============================================================================
// Example 1: Minting an Ad Creative as NFT
// =============================================================================

export async function mintAdCreativeExample() {
  console.log('Example 1: Minting Ad Creative NFT');

  // Step 1: User selects file
  const file = new File(['fake-image-data'], 'summer-banner.png', { type: 'image/png' });

  // Step 2: Upload file to IPFS
  const fileResult = await uploadFileToIPFS(file);
  console.log('File uploaded to IPFS:', fileResult.ipfsHash);

  // Step 3: Build metadata
  const metadata = buildNFTMetadata({
    name: 'Summer Campaign Banner',
    description: 'Vibrant summer-themed banner for seasonal promotion',
    imageHash: fileResult.ipfsHash,
    category: 'banner',
    tags: ['summer', 'seasonal', 'colorful'],
    licenseType: 'CC-BY-NC',
    commercialUse: false,
    mediaType: 'image/png',
    creator: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    attributes: [
      { trait_type: 'Dimensions', value: '1920x1080' },
      { trait_type: 'File Size', value: '2.3 MB' },
    ],
  });

  // Step 4: Upload metadata to IPFS
  const metadataResult = await uploadMetadataToIPFS(metadata);
  console.log('Metadata uploaded to IPFS:', metadataResult.ipfsHash);

  // Step 5: Mint NFT on-chain
  const mintResult = await mintCreativeNFT(
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ad-creative-nft',
    metadata.name,
    metadata.description,
    fileResult.ipfsHash,
    'image/png',
    'CC-BY-NC',
    false,
    'banner',
    ['summer', 'seasonal', 'colorful']
  );

  console.log('NFT minted with token ID:', mintResult.tokenId);
  return mintResult;
}

// =============================================================================
// Example 2: Listing NFT for Sale on Marketplace
// =============================================================================

export async function listNFTForSaleExample() {
  console.log('Example 2: Listing NFT for Sale');

  const tokenId = 1;
  const priceInSTX = 100; // 100 STX
  const durationInBlocks = 1440; // ~10 days

  // List NFT for sale
  const listResult = await listForSale(
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.creative-marketplace',
    tokenId,
    priceInSTX,
    durationInBlocks
  );

  console.log('NFT listed for sale:', listResult);
  return listResult;
}

// =============================================================================
// Example 3: Buying an NFT from Marketplace
// =============================================================================

export async function buyNFTExample() {
  console.log('Example 3: Buying NFT');

  const tokenId = 1;

  // Get NFT info first
  const creativeInfo = await getCreativeInfo(
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ad-creative-nft',
    tokenId
  );

  console.log('Creative info:', creativeInfo);

  // Calculate royalty (10%)
  const salePrice = 100;
  const royalty = await calculateRoyalty(
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ad-creative-nft',
    salePrice,
    tokenId
  );

  console.log('Royalty amount:', royalty, 'STX');
  console.log('Seller receives:', salePrice - royalty - (salePrice * 0.025), 'STX');

  // Buy NFT
  const buyResult = await buyNFT(
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.creative-marketplace',
    tokenId
  );

  console.log('NFT purchased:', buyResult);
  return buyResult;
}

// =============================================================================
// Example 4: Minting Impression Proof NFT
// =============================================================================

export async function mintImpressionProofExample() {
  console.log('Example 4: Minting Impression Proof NFT');

  const campaignId = 42;
  const creativeTokenId = 1;
  const totalImpressions = 1250000; // 1.25M impressions = Gold tier
  const totalRevenue = 450; // 450 STX earned
  const startBlock = 12000;
  const endBlock = 15000;

  // Build impression proof metadata
  const metadata = {
    name: 'Gold Tier Achievement - Campaign #42',
    description: '1.25M impressions milestone reached',
    image: 'ipfs://QmGoldBadgeImage...',
    attributes: [
      { trait_type: 'Tier', value: 'Gold' },
      { trait_type: 'Impressions', value: totalImpressions.toString() },
      { trait_type: 'Revenue', value: `${totalRevenue} STX` },
      { trait_type: 'Campaign ID', value: campaignId.toString() },
    ],
    properties: {
      campaign_id: campaignId,
      creative_token_id: creativeTokenId,
      tier: 'gold',
      start_block: startBlock,
      end_block: endBlock,
    },
  };

  // Upload metadata to IPFS
  const metadataResult = await uploadMetadataToIPFS(metadata);

  // Mint impression proof NFT
  const mintResult = await mintImpressionProof(
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.impression-proof-nft',
    campaignId,
    creativeTokenId,
    totalImpressions,
    totalRevenue,
    startBlock,
    endBlock,
    `ipfs://${metadataResult.ipfsHash}`
  );

  console.log('Impression proof minted:', mintResult);
  return mintResult;
}

// =============================================================================
// Example 5: Complete NFT Upload Workflow
// =============================================================================

export async function completeNFTUploadWorkflow(file: File) {
  console.log('Example 5: Complete NFT Upload Workflow');

  try {
    // Upload file and metadata in one call
    const { metadataUri, imageHash, metadataHash } = await uploadNFTToIPFS(file, {
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      description: 'Uploaded via AdStack NFT system',
      properties: {
        category: 'banner',
        tags: ['ad', 'creative'],
        license_type: 'CC-BY',
        commercial_use: true,
        media_type: file.type,
        creator: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
        created_at: Date.now(),
      },
    });

    console.log('Upload complete:', {
      metadataUri,
      imageHash,
      metadataHash,
      imageUrl: ipfsToHttpUrl(imageHash),
      metadataUrl: ipfsToHttpUrl(metadataHash),
    });

    return { metadataUri, imageHash, metadataHash };
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

// =============================================================================
// Example 6: React Component Integration
// =============================================================================

export function NFTDashboardExample() {
  return (
    <div className="nft-dashboard">
      <h1>NFT Dashboard</h1>

      {/* Mint new NFTs */}
      <section>
        <h2>Mint Creative NFT</h2>
        <CreativeMintingUI />
      </section>

      {/* Browse marketplace */}
      <section>
        <h2>Marketplace</h2>
        <MarketplaceGallery />
      </section>

      {/* View collection */}
      <section>
        <h2>My Collection</h2>
        <NFTCollectionViewer />
      </section>

      {/* Achievement badges */}
      <section>
        <h2>Achievements</h2>
        <ImpressionShowcase />
      </section>
    </div>
  );
}

// =============================================================================
// Example 7: License Management Workflow
// =============================================================================

export function LicenseManagementExample() {
  return (
    <div className="license-management">
      <h1>License Management</h1>

      {/* Manage licenses */}
      <CreativeLicenseManager />

      {/* Calculate royalties */}
      <section>
        <h2>Royalty Calculator</h2>
        <RoyaltyCalculator />
      </section>
    </div>
  );
}

// =============================================================================
// Example 8: NFT Transfer Workflow
// =============================================================================

export function NFTTransferExample() {
  return (
    <div className="nft-transfer">
      <h1>Transfer NFT</h1>
      <NFTTransferInterface />
    </div>
  );
}

// =============================================================================
// Example 9: Edit NFT Metadata
// =============================================================================

export function EditMetadataExample() {
  const tokenId = 1;
  const initialMetadata = {
    name: 'Summer Campaign Banner',
    description: 'Vibrant summer-themed banner',
    category: 'banner',
    tags: ['summer', 'seasonal'],
    attributes: [],
    externalUrl: '',
    backgroundColor: '#FF5733',
  };

  const handleSave = (updatedMetadata: any) => {
    console.log('Saving updated metadata:', updatedMetadata);
    // TODO: Call contract to update metadata URI
  };

  return (
    <div className="edit-metadata">
      <h1>Edit NFT Metadata</h1>
      <NFTMetadataEditor
        tokenId={tokenId}
        initialMetadata={initialMetadata}
        onSave={handleSave}
      />
    </div>
  );
}

// =============================================================================
// Example 10: Check Achievement Tier
// =============================================================================

export async function checkAchievementTierExample(impressions: number) {
  console.log('Example 10: Check Achievement Tier');

  const thresholds = await getTierThresholds();
  console.log('Tier thresholds:', thresholds);

  let tier = 'none';
  if (impressions >= thresholds.diamond) {
    tier = 'diamond';
  } else if (impressions >= thresholds.platinum) {
    tier = 'platinum';
  } else if (impressions >= thresholds.gold) {
    tier = 'gold';
  } else if (impressions >= thresholds.silver) {
    tier = 'silver';
  } else if (impressions >= thresholds.bronze) {
    tier = 'bronze';
  }

  console.log(`Impressions: ${impressions} = ${tier.toUpperCase()} tier`);
  return tier;
}

// =============================================================================
// Example 11: Batch NFT Operations
// =============================================================================

export async function batchMintNFTsExample(files: File[]) {
  console.log('Example 11: Batch Mint NFTs');

  const results = await Promise.all(
    files.map(async (file, index) => {
      try {
        // Upload to IPFS
        const { metadataUri, imageHash } = await uploadNFTToIPFS(file, {
          name: `Ad Creative #${index + 1}`,
          description: `Batch uploaded creative #${index + 1}`,
          properties: {
            category: 'banner',
            tags: ['batch', 'upload'],
            license_type: 'CC-BY',
            commercial_use: true,
            media_type: file.type,
            creator: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
            created_at: Date.now(),
          },
        });

        // Mint NFT
        const mintResult = await mintCreativeNFT(
          'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ad-creative-nft',
          `Ad Creative #${index + 1}`,
          `Batch uploaded creative #${index + 1}`,
          imageHash,
          file.type,
          'CC-BY',
          true,
          'banner',
          ['batch', 'upload']
        );

        return { success: true, tokenId: mintResult.tokenId, file: file.name };
      } catch (error) {
        return { success: false, error: error.message, file: file.name };
      }
    })
  );

  console.log('Batch mint results:', results);
  return results;
}

// =============================================================================
// Example 12: NFT Analytics
// =============================================================================

export async function getNFTAnalyticsExample(tokenId: number) {
  console.log('Example 12: NFT Analytics');

  // Get creative info
  const info = await getCreativeInfo(
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.ad-creative-nft',
    tokenId
  );

  if (!info) {
    console.log('NFT not found');
    return null;
  }

  // Calculate analytics
  const analytics = {
    tokenId: info.tokenId,
    name: info.name,
    creator: info.creator,
    totalImpressions: info.totalImpressions,
    totalRevenue: info.totalRevenue,
    revenuePerImpression: info.totalRevenue / info.totalImpressions,
    estimatedRoyalties: info.totalRevenue * 0.1, // 10% royalty
  };

  console.log('NFT Analytics:', analytics);
  return analytics;
}

// =============================================================================
// Example Usage
// =============================================================================

export async function runAllExamples() {
  console.log('Running all NFT integration examples...\n');

  // Example 1: Mint NFT
  await mintAdCreativeExample();

  // Example 2: List for sale
  await listNFTForSaleExample();

  // Example 3: Buy NFT
  await buyNFTExample();

  // Example 4: Mint impression proof
  await mintImpressionProofExample();

  // Example 10: Check achievement tier
  await checkAchievementTierExample(1250000);

  // Example 12: Get analytics
  await getNFTAnalyticsExample(1);

  console.log('\nAll examples completed!');
}

// Export all examples
export default {
  mintAdCreativeExample,
  listNFTForSaleExample,
  buyNFTExample,
  mintImpressionProofExample,
  completeNFTUploadWorkflow,
  NFTDashboardExample,
  LicenseManagementExample,
  NFTTransferExample,
  EditMetadataExample,
  checkAchievementTierExample,
  batchMintNFTsExample,
  getNFTAnalyticsExample,
  runAllExamples,
};
