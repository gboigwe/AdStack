'use client';

import { useState } from 'react';
import { Grid, List, Search, Filter, SortAsc, Eye, Heart, Share2 } from 'lucide-react';

interface NFT {
  tokenId: number;
  name: string;
  description: string;
  imageUrl: string;
  creator: string;
  owner: string;
  category: string;
  tags: string[];
  mintDate: number;
  totalImpressions: number;
  totalRevenue: number;
  liked: boolean;
}

export function NFTCollectionViewer() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'revenue'>('recent');

  // Mock NFT collection
  const nfts: NFT[] = [
    {
      tokenId: 1,
      name: 'Summer Campaign Banner',
      description: 'Vibrant summer-themed banner ad for seasonal promotion',
      imageUrl: 'https://via.placeholder.com/300',
      creator: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      owner: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      category: 'banner',
      tags: ['summer', 'seasonal', 'colorful'],
      mintDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
      totalImpressions: 1250000,
      totalRevenue: 450,
      liked: true,
    },
    {
      tokenId: 2,
      name: 'Product Launch Video',
      description: '30-second product launch promotional video',
      imageUrl: 'https://via.placeholder.com/300',
      creator: 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE',
      owner: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      category: 'video',
      tags: ['product', 'launch', 'promotional'],
      mintDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
      totalImpressions: 850000,
      totalRevenue: 320,
      liked: false,
    },
    {
      tokenId: 3,
      name: 'Social Media Creative',
      description: 'Eye-catching social media ad creative set',
      imageUrl: 'https://via.placeholder.com/300',
      creator: 'SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8QE',
      owner: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
      category: 'social',
      tags: ['social', 'instagram', 'facebook'],
      mintDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
      totalImpressions: 2100000,
      totalRevenue: 780,
      liked: true,
    },
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'banner', label: 'Banner Ads' },
    { value: 'video', label: 'Video Ads' },
    { value: 'social', label: 'Social Media' },
    { value: 'print', label: 'Print Ads' },
  ];

  const filteredNFTs = nfts
    .filter((nft) => {
      const matchesSearch =
        nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || nft.category === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.mintDate - a.mintDate;
        case 'popular':
          return b.totalImpressions - a.totalImpressions;
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        default:
          return 0;
      }
    });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My NFT Collection</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NFTs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular' | 'revenue')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg appearance-none"
            >
              <option value="recent">Recently Minted</option>
              <option value="popular">Most Impressions</option>
              <option value="revenue">Highest Revenue</option>
            </select>
          </div>
        </div>
      </div>

      {/* NFT Grid/List */}
      {filteredNFTs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No NFTs found matching your criteria</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNFTs.map((nft) => (
            <div
              key={nft.tokenId}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="relative">
                <img src={nft.imageUrl} alt={nft.name} className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
                    {nft.liked ? (
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    ) : (
                      <Heart className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  <button className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
                    <Share2 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{nft.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{nft.description}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {nft.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Impressions</p>
                    <p className="font-semibold">{formatNumber(nft.totalImpressions)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Revenue</p>
                    <p className="font-semibold">{nft.totalRevenue} STX</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <span>#{nft.tokenId}</span>
                  <span>{formatDate(nft.mintDate)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNFTs.map((nft) => (
            <div
              key={nft.tokenId}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="flex">
                <img src={nft.imageUrl} alt={nft.name} className="w-32 h-32 object-cover" />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{nft.name}</h3>
                      <p className="text-sm text-gray-600">{nft.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded">
                        {nft.liked ? (
                          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                        ) : (
                          <Heart className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Share2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {nft.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Token ID:</span>
                      <span className="font-semibold ml-1">#{nft.tokenId}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Impressions:</span>
                      <span className="font-semibold ml-1">
                        {formatNumber(nft.totalImpressions)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Revenue:</span>
                      <span className="font-semibold ml-1">{nft.totalRevenue} STX</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Minted:</span>
                      <span className="font-semibold ml-1">{formatDate(nft.mintDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Impressions</p>
              <p className="text-2xl font-bold">
                {formatNumber(nfts.reduce((sum, nft) => sum + nft.totalImpressions, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Grid className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">NFTs Owned</p>
              <p className="text-2xl font-bold">{nfts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">
                {nfts.reduce((sum, nft) => sum + nft.totalRevenue, 0)} STX
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
