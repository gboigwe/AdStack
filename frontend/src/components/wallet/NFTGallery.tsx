/**
 * NFT Gallery Component
 * Displays user's NFT collection with details
 */

'use client';

import { useState, useEffect } from 'react';
import { Grid3x3, List, ExternalLink, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { CURRENT_NETWORK } from '@/lib/stacks-config';

/**
 * NFT Interface
 */
interface NFT {
  id: string;
  contractAddress: string;
  tokenId: number;
  name: string;
  description?: string;
  imageUrl?: string;
  collection: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

type ViewMode = 'grid' | 'list';

interface NFTGalleryProps {
  className?: string;
}

export function NFTGallery({ className = '' }: NFTGalleryProps) {
  const { address, isConnected } = useWalletStore();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  useEffect(() => {
    if (address && isConnected) {
      fetchNFTs();
    }
  }, [address, isConnected]);

  const fetchNFTs = async () => {
    if (!address) return;

    setLoading(true);

    try {
      // TODO: Fetch real NFTs from Stacks API
      // https://api.hiro.so/extended/v1/tokens/nft/holdings?principal={address}

      // Mock NFT data
      const mockNFTs: NFT[] = [
        {
          id: '1',
          contractAddress: 'SP2X0TZ59D5SZ8ACQ6YMCHHNR2ZN51Z32E2CJ173.the-explorer-guild',
          tokenId: 42,
          name: 'Explorer #42',
          description: 'A rare explorer from the guild',
          imageUrl: 'https://via.placeholder.com/300x300/6366f1/ffffff?text=NFT+1',
          collection: 'The Explorer Guild',
          attributes: [
            { trait_type: 'Rarity', value: 'Rare' },
            { trait_type: 'Level', value: 5 },
          ],
        },
        {
          id: '2',
          contractAddress: 'SP3D6PV2ACBPEKYJTCMH7HEN02KP87QSP8KTEH335.megapont-space-agency',
          tokenId: 128,
          name: 'Megapont Ape #128',
          description: 'Space-faring ape',
          imageUrl: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=NFT+2',
          collection: 'Megapont Space Agency',
          attributes: [
            { trait_type: 'Background', value: 'Space' },
            { trait_type: 'Eyes', value: 'Laser' },
          ],
        },
        {
          id: '3',
          contractAddress: 'SP2BE8TZATXEVPGZ8HAFZYE5GKZ02X0YRQYEWYF8.bitcoin-monkeys',
          tokenId: 256,
          name: 'Bitcoin Monkey #256',
          description: 'A Bitcoin-loving monkey',
          imageUrl: 'https://via.placeholder.com/300x300/ec4899/ffffff?text=NFT+3',
          collection: 'Bitcoin Monkeys',
          attributes: [
            { trait_type: 'Hat', value: 'Bitcoin Cap' },
            { trait_type: 'Expression', value: 'Happy' },
          ],
        },
      ];

      setNfts(mockNFTs);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExplorerUrl = (nft: NFT) => {
    return CURRENT_NETWORK === 'mainnet'
      ? `https://explorer.hiro.so/txid/${nft.contractAddress}::${nft.tokenId}`
      : `https://explorer.hiro.so/txid/${nft.contractAddress}::${nft.tokenId}?chain=testnet`;
  };

  if (!isConnected) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-600">Connect your wallet to view your NFT collection</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">NFT Collection</h2>
            <p className="text-sm text-gray-600 mt-1">{nfts.length} items</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchNFTs}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid3x3 className="w-4 h-4 text-gray-700" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NFT Grid/List */}
      <div className="p-6">
        {loading && nfts.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading NFTs...</p>
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No NFTs found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <div
                key={nft.id}
                onClick={() => setSelectedNFT(nft)}
                className="group bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {nft.imageUrl ? (
                    <img
                      src={nft.imageUrl}
                      alt={nft.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-xs text-gray-600 mb-1">{nft.collection}</p>
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{nft.name}</h3>
                  <p className="text-xs text-gray-600">#{nft.tokenId}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {nfts.map((nft) => (
              <div
                key={nft.id}
                className="flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedNFT(nft)}
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {nft.imageUrl ? (
                    <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{nft.name}</h3>
                  <p className="text-sm text-gray-600">{nft.collection} #{nft.tokenId}</p>
                </div>

                {/* Action */}
                <a
                  href={getExplorerUrl(nft)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setSelectedNFT(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="aspect-square bg-gray-100">
              {selectedNFT.imageUrl ? (
                <img
                  src={selectedNFT.imageUrl}
                  alt={selectedNFT.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-2">{selectedNFT.collection}</p>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedNFT.name}</h2>

              {selectedNFT.description && (
                <p className="text-gray-700 mb-6">{selectedNFT.description}</p>
              )}

              {/* Attributes */}
              {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Attributes</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedNFT.attributes.map((attr, idx) => (
                      <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">{attr.trait_type}</p>
                        <p className="font-medium text-gray-900">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href={getExplorerUrl(selectedNFT)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View on Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedNFT(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
