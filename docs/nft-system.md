# NFT-Based Ad Creative System

## Overview

The AdStack NFT system enables advertisers to mint their ad creatives as NFTs (SIP-009), creating verifiable ownership, enabling secondary markets, and providing automatic royalty payments. The system consists of three smart contracts and a comprehensive frontend interface.

## Smart Contracts

### 1. ad-creative-nft.clar

**Purpose**: Core NFT contract implementing SIP-009 standard for ad creative ownership.

**Key Features**:
- Mint ad creatives as NFTs with full metadata
- IPFS-based storage for media and metadata
- Automatic 10% royalty on secondary sales
- License management (CC-BY, CC-BY-NC, etc.)
- Category and tag system for organization
- Commercial use permissions

**Public Functions**:

```clarity
;; Mint a new creative NFT
(define-public (mint-creative
  (name (string-utf8 256))
  (description (string-utf8 1024))
  (ipfs-hash (string-ascii 64))
  (media-type (string-ascii 32))
  (license-type (string-ascii 32))
  (commercial-use bool)
  (category (string-ascii 64))
  (tags (list 10 (string-ascii 32)))
))

;; Transfer NFT with automatic royalty payment
(define-public (sell-with-royalty
  (token-id uint)
  (buyer principal)
  (sale-price uint)
))

;; Update metadata URI
(define-public (update-metadata-uri
  (token-id uint)
  (new-uri (string-ascii 256))
))
```

**Read-Only Functions**:
- `get-creative-info` - Retrieve NFT metadata
- `get-royalty-percentage` - Get royalty rate
- `calculate-royalty` - Calculate royalty for a sale price
- `get-license-info` - Get license details

### 2. creative-marketplace.clar

**Purpose**: Marketplace for buying, selling, and licensing NFTs.

**Key Features**:
- Fixed price listings
- Auction mechanism with bidding
- License offering system
- 2.5% marketplace fee
- Automatic royalty distribution
- Escrow for auctions

**Public Functions**:

```clarity
;; List NFT for sale at fixed price
(define-public (list-for-sale
  (token-id uint)
  (price uint)
  (duration uint)
))

;; Buy NFT at listed price
(define-public (buy-now (token-id uint)))

;; Create auction
(define-public (create-auction
  (token-id uint)
  (min-bid uint)
  (duration uint)
))

;; Place bid on auction
(define-public (place-bid
  (token-id uint)
  (bid-amount uint)
))

;; Complete auction (highest bidder wins)
(define-public (complete-auction (token-id uint)))

;; Offer license for rental
(define-public (offer-license
  (token-id uint)
  (price-per-day uint)
  (max-duration uint)
  (commercial-allowed bool)
))

;; Purchase license
(define-public (purchase-license
  (token-id uint)
  (duration uint)
  (commercial bool)
))
```

**Fee Structure**:
- Marketplace fee: 2.5% on all sales
- Creator royalty: 10% on secondary sales
- Total fees on secondary sales: 12.5%

### 3. impression-proof-nft.clar

**Purpose**: Achievement NFTs minted at impression milestones.

**Key Features**:
- Automatic minting at milestone thresholds
- 5 achievement tiers (Bronze through Diamond)
- Campaign performance tracking
- Revenue verification
- Creator stats aggregation

**Achievement Tiers**:
- **Bronze**: 100,000 impressions
- **Silver**: 500,000 impressions
- **Gold**: 1,000,000 impressions
- **Platinum**: 5,000,000 impressions
- **Diamond**: 10,000,000 impressions

**Public Functions**:

```clarity
;; Mint impression proof NFT
(define-public (mint-impression-proof
  (campaign-id uint)
  (creative-token-id uint)
  (total-impressions uint)
  (total-revenue uint)
  (start-block uint)
  (end-block uint)
  (metadata-uri (string-ascii 256))
))
```

## Frontend Components

### Core Components

#### 1. CreativeMintingUI

Comprehensive interface for minting ad creative NFTs.

**Features**:
- File upload with drag-and-drop
- Image/video preview
- IPFS upload with progress
- Metadata editing (name, description)
- License type selection
- Tag management (max 10 tags)
- Category selection
- Commercial use toggle

**Usage**:
```typescript
import { CreativeMintingUI } from '@/components/nft';

<CreativeMintingUI />
```

#### 2. MarketplaceGallery

Browse and purchase NFTs from the marketplace.

**Features**:
- Grid/list view toggle
- Filtering by category and tags
- Sorting (recent, popular, price)
- Quick buy functionality
- NFT detail modal

**Usage**:
```typescript
import { MarketplaceGallery } from '@/components/nft';

<MarketplaceGallery />
```

#### 3. NFTMetadataEditor

Edit NFT metadata post-minting.

**Features**:
- Update name and description
- Modify category
- Add/remove tags
- Edit custom attributes
- Update external URL
- Change background color

**Usage**:
```typescript
import { NFTMetadataEditor } from '@/components/nft';

<NFTMetadataEditor
  tokenId={1}
  initialMetadata={metadata}
  onSave={(updatedMetadata) => console.log(updatedMetadata)}
/>
```

#### 4. CreativeLicenseManager

Manage licensing for NFT rentals.

**Features**:
- View active licenses
- Create license offers
- Set price per day
- Define max duration
- Toggle commercial use permissions
- License preview with revenue calculation

**Usage**:
```typescript
import { CreativeLicenseManager } from '@/components/nft';

<CreativeLicenseManager />
```

#### 5. NFTTransferInterface

Transfer NFTs between wallets.

**Features**:
- Select NFT from owned collection
- Recipient address validation
- Transfer preview
- Transaction status tracking
- Safety warnings

**Usage**:
```typescript
import { NFTTransferInterface } from '@/components/nft';

<NFTTransferInterface />
```

#### 6. NFTCollectionViewer

View and manage NFT collection.

**Features**:
- Grid/list view modes
- Search by name, description, tags
- Category filtering
- Sort by date, impressions, revenue
- Collection statistics
- Like/share functionality

**Usage**:
```typescript
import { NFTCollectionViewer } from '@/components/nft';

<NFTCollectionViewer />
```

#### 7. ImpressionShowcase

Display achievement tier NFTs.

**Features**:
- Visual tier badges
- Milestone thresholds
- Tier progression tracking

**Usage**:
```typescript
import { ImpressionShowcase } from '@/components/nft';

<ImpressionShowcase />
```

#### 8. RoyaltyCalculator

Calculate royalties for NFT sales.

**Features**:
- Sale price input
- Automatic 10% royalty calculation
- Creator/seller revenue breakdown

**Usage**:
```typescript
import { RoyaltyCalculator } from '@/components/nft';

<RoyaltyCalculator />
```

## Utility Libraries

### IPFS Integration (`lib/nft/ipfs.ts`)

**Key Functions**:

```typescript
// Upload file to IPFS
uploadFileToIPFS(file: File): Promise<IPFSUploadResult>

// Upload metadata JSON to IPFS
uploadMetadataToIPFS(metadata: NFTMetadata): Promise<IPFSUploadResult>

// Upload both file and metadata
uploadNFTToIPFS(
  file: File,
  metadata: Omit<NFTMetadata, 'image'>
): Promise<{ metadataUri: string; imageHash: string; metadataHash: string }>

// Fetch data from IPFS
fetchFromIPFS(ipfsHash: string): Promise<any>

// Convert IPFS URI to HTTP URL
ipfsToHttpUrl(ipfsUri: string, gateway?: string): string

// Validate IPFS hash
isValidIPFSHash(hash: string): boolean

// Pin/unpin files
pinToIPFS(ipfsHash: string): Promise<boolean>
unpinFromIPFS(ipfsHash: string): Promise<boolean>
```

**IPFS Gateways**:
- Primary: `https://ipfs.io/ipfs/`
- Fallback: `https://cloudflare-ipfs.com/ipfs/`
- Pinata: `https://gateway.pinata.cloud/ipfs/`

### Contract Utilities (`lib/nft/contracts.ts`)

**Key Functions**:

```typescript
// Mint creative NFT
mintCreativeNFT(
  contractAddress: string,
  name: string,
  description: string,
  ipfsHash: string,
  mediaType: string,
  licenseType: string,
  commercialUse: boolean,
  category: string,
  tags: string[]
): Promise<any>

// List for sale
listForSale(
  contractAddress: string,
  tokenId: number,
  price: number,
  duration: number
): Promise<any>

// Buy NFT
buyNFT(contractAddress: string, tokenId: number): Promise<any>

// Get creative info
getCreativeInfo(
  contractAddress: string,
  tokenId: number
): Promise<CreativeNFT | null>

// Calculate royalty
calculateRoyalty(
  contractAddress: string,
  salePrice: number,
  tokenId: number
): Promise<number>

// Mint impression proof
mintImpressionProof(
  contractAddress: string,
  campaignId: number,
  creativeTokenId: number,
  totalImpressions: number,
  totalRevenue: number,
  startBlock: number,
  endBlock: number,
  metadataUri: string
): Promise<any>

// Get tier thresholds
getTierThresholds(): Promise<Record<string, number>>
```

## Workflow Examples

### Minting an Ad Creative NFT

1. **Upload Media**: User uploads image/video file
2. **IPFS Upload**: File is uploaded to IPFS, returns hash
3. **Create Metadata**: Build NFT metadata object with IPFS hash
4. **Upload Metadata**: Metadata JSON uploaded to IPFS
5. **Mint NFT**: Call `mint-creative` with metadata URI
6. **Confirmation**: NFT minted with token ID returned

### Selling an NFT on Marketplace

1. **List NFT**: Call `list-for-sale` with price and duration
2. **Buyer Browse**: Marketplace gallery shows listed NFT
3. **Purchase**: Buyer calls `buy-now` with token ID
4. **Distribution**: Contract distributes:
   - 10% to original creator (royalty)
   - 2.5% to marketplace (fee)
   - 87.5% to seller
5. **Transfer**: NFT ownership transferred to buyer

### Licensing a Creative

1. **Offer License**: Creator calls `offer-license` with terms
2. **Purchase License**: Licensee calls `purchase-license` with duration
3. **Payment**: Daily rate × duration paid to creator
4. **Usage Period**: License active for specified duration
5. **Expiration**: License expires after duration ends

### Earning Achievement NFT

1. **Campaign Running**: Ad creative generates impressions
2. **Threshold Check**: System monitors impression count
3. **Milestone Reached**: 100K impressions achieved
4. **Auto-Mint**: Impression proof NFT minted with Bronze tier
5. **Showcase**: Achievement displayed in ImpressionShowcase

## NFT Metadata Standard

### Image Metadata Format

```json
{
  "name": "Summer Campaign Banner",
  "description": "Vibrant summer-themed banner ad",
  "image": "ipfs://QmXxx...",
  "external_url": "https://example.com/creative/1",
  "background_color": "#FF5733",
  "attributes": [
    {
      "trait_type": "Dimensions",
      "value": "1920x1080"
    },
    {
      "trait_type": "File Size",
      "value": "2.3 MB"
    }
  ],
  "properties": {
    "category": "banner",
    "tags": ["summer", "seasonal", "colorful"],
    "license_type": "CC-BY-NC",
    "commercial_use": false,
    "media_type": "image/png",
    "creator": "SP2J6ZY...",
    "created_at": 1735689600
  }
}
```

### Impression Proof Metadata Format

```json
{
  "name": "Gold Tier Achievement - Campaign #42",
  "description": "1M impressions milestone",
  "image": "ipfs://QmYxx...",
  "attributes": [
    {
      "trait_type": "Tier",
      "value": "Gold"
    },
    {
      "trait_type": "Impressions",
      "value": 1250000
    },
    {
      "trait_type": "Revenue",
      "value": "450 STX"
    },
    {
      "trait_type": "Campaign ID",
      "value": 42
    }
  ],
  "properties": {
    "campaign_id": 42,
    "creative_token_id": 1,
    "tier": "gold",
    "start_block": 12000,
    "end_block": 15000
  }
}
```

## Security Considerations

### Smart Contract Security

1. **Ownership Validation**: All transfer functions verify caller is owner
2. **Royalty Protection**: Royalty percentage immutable (10%)
3. **Escrow Safety**: Auction bids held in escrow until completion
4. **Reentrancy Protection**: State updated before external calls
5. **Integer Overflow**: Clarity prevents overflow/underflow

### Frontend Security

1. **Address Validation**: Validate Stacks addresses before transactions
2. **IPFS Hash Validation**: Verify CID format before use
3. **Input Sanitization**: Sanitize user inputs for metadata
4. **Transaction Confirmation**: Show preview before execution
5. **Error Handling**: Graceful handling of failed transactions

### IPFS Best Practices

1. **Pinning**: Pin all uploaded files to ensure availability
2. **Backup**: Use multiple pinning services (Pinata, NFT.Storage)
3. **Gateway Fallback**: Multiple gateways for redundancy
4. **Content Addressing**: Immutable IPFS hashes prevent tampering
5. **Metadata Verification**: Validate metadata matches on-chain hash

## Cost Analysis

### Deployment Costs
- `ad-creative-nft`: 160,000 STX
- `creative-marketplace`: 180,000 STX
- `impression-proof-nft`: 165,000 STX
- **Total**: 505,000 STX

### Transaction Costs (estimated)
- Mint creative NFT: ~0.01 STX
- List for sale: ~0.005 STX
- Buy NFT: ~0.015 STX
- Create auction: ~0.01 STX
- Place bid: ~0.008 STX
- Mint impression proof: ~0.01 STX

### IPFS Costs
- Pinata: $0-20/month (depends on storage)
- NFT.Storage: Free tier available
- Web3.Storage: Free tier available

## Testing

### Contract Testing

```bash
# Run all NFT contract tests
clarinet test tests/ad-creative-nft.test.ts
clarinet test tests/creative-marketplace.test.ts
clarinet test tests/impression-proof-nft.test.ts
```

### Frontend Testing

```bash
# Component tests
npm run test:components

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Roadmap

### Phase 1 (Current)
- ✅ Core NFT contracts
- ✅ Marketplace with auctions
- ✅ Impression achievement system
- ✅ Frontend components
- ✅ IPFS integration

### Phase 2 (Planned)
- [ ] Cross-chain NFT bridge
- [ ] Fractionalized NFT ownership
- [ ] NFT-backed loans
- [ ] Dynamic NFTs (metadata updates based on performance)

### Phase 3 (Future)
- [ ] AI-generated creative NFTs
- [ ] 3D/AR ad creative support
- [ ] NFT collection aggregation
- [ ] Metaverse integration

## References

- [SIP-009 NFT Standard](https://github.com/stacksgov/sips/blob/main/sips/sip-009/sip-009-nft-standard.md)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Clarity Language Reference](https://docs.stacks.co/clarity/)
- [NFT Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
