'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Tag, TrendingUp, Filter } from 'lucide-react';

interface NFTListing {
  tokenId: number;
  name: string;
  price: number;
  seller: string;
  imageUrl: string;
  category: string;
  impressions: number;
}

export function MarketplaceGallery() {
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, [filter, sortBy]);

  const loadListings = async () => {
    setLoading(true);
    // TODO: Fetch from creative-marketplace contract
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setListings([]);
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Creative NFT Marketplace</h1>
        <p className="text-gray-600">Browse and buy ad creative NFTs</p>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Categories</option>
          <option value="banner">Banners</option>
          <option value="video">Videos</option>
          <option value="social">Social</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="recent">Most Recent</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No listings available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((nft) => (
            <div key={nft.tokenId} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <img src={nft.imageUrl} alt={nft.name} className="w-full h-48 object-cover rounded-t-lg" />
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{nft.name}</h3>
                <p className="text-2xl font-bold text-blue-600 mb-2">{nft.price / 1000000} STX</p>
                <button className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
