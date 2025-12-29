'use client';

import { useEffect, useState } from 'react';
import { Wallet, Menu, X } from 'lucide-react';
import { getWalletAddress, isWalletConnected } from '@/lib/wallet';
import { useWalletStore } from '@/store/wallet-store';
import { WalletConnectButton } from './wallet/WalletModal';
import { AccountSwitcher } from './wallet/AccountSwitcher';
import { autoReconnectWallet } from '@/lib/wallet-session';

export function Header() {
  const { address, isConnected, setAddress, setConnected } = useWalletStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Auto-reconnect wallet on mount
    const reconnect = async () => {
      const result = await autoReconnectWallet();
      if (result.success && result.address) {
        setAddress(result.address);
        setConnected(true);
      }
    };

    reconnect();
  }, [setAddress, setConnected]);

  if (!mounted) {
    return null;
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40 backdrop-blur-sm bg-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">AdStack</h1>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Home
              </a>
              <a href="/advertiser" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Advertiser
              </a>
              <a href="/publisher" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Publisher
              </a>
            </nav>
          </div>

          {/* Desktop Wallet Connection */}
          <div className="hidden md:flex items-center gap-3">
            {isConnected && address ? (
              <AccountSwitcher />
            ) : (
              <WalletConnectButton />
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <a
                href="/"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="/advertiser"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Advertiser
              </a>
              <a
                href="/publisher"
                className="text-gray-700 hover:text-blue-600 transition-colors font-medium px-2 py-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                Publisher
              </a>

              {/* Mobile Wallet Connection */}
              <div className="pt-4 border-t border-gray-200">
                {isConnected && address ? (
                  <AccountSwitcher className="w-full" />
                ) : (
                  <WalletConnectButton />
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
