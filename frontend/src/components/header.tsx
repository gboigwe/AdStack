'use client';

import { useEffect, useState } from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { connectWallet, disconnectWallet, getWalletAddress, isWalletConnected } from '@/lib/wallet';
import { useWalletStore } from '@/store/wallet-store';

export function Header() {
  const { address, isConnected, setAddress, setConnected, disconnect } = useWalletStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isWalletConnected()) {
      const addr = getWalletAddress();
      setAddress(addr);
      setConnected(true);
    }
  }, [setAddress, setConnected]);

  const handleConnect = async () => {
    try {
      await connectWallet();
      const addr = getWalletAddress();
      setAddress(addr);
      setConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    disconnect();
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!mounted) {
    return null;
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">AdStack</h1>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              Home
            </a>
            <a href="/advertiser" className="text-gray-700 hover:text-blue-600 transition-colors">
              Advertiser
            </a>
            <a href="/publisher" className="text-gray-700 hover:text-blue-600 transition-colors">
              Publisher
            </a>
          </nav>

          <div>
            {isConnected && address ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{truncateAddress(address)}</span>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
