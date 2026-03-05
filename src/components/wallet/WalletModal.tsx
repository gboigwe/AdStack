/**
 * Multi-Wallet Connection Modal
 * Displays all supported Stacks wallets with connection options
 */

'use client';

import { useState } from 'react';
import { X, ExternalLink, Smartphone, Monitor, Check } from 'lucide-react';
import { SUPPORTED_WALLETS } from '@/lib/appkit-config';
import { connectWallet } from '@/lib/wallet';
import { useWalletStore } from '@/store/wallet-store';
import { parseStacksError } from '@/lib/error-handler';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setAddress, setConnected } = useWalletStore();

  if (!isOpen) return null;

  const handleWalletConnect = async (walletId: string) => {
    setConnecting(walletId);
    setError(null);

    try {
      // Use Stacks Connect for wallet connection
      await connectWallet();

      // Update wallet store
      const { getWalletAddress } = await import('@/lib/wallet');
      const address = getWalletAddress();

      if (address) {
        setAddress(address);
        setConnected(true);

        // Save wallet preference
        if (typeof window !== 'undefined') {
          localStorage.setItem('adstack_wallet_id', walletId);
        }

        onClose();
      }
    } catch (err: any) {
      const parsedError = parseStacksError(err);
      if (parsedError.code !== 'USER_REJECTED') {
        setError(parsedError.message);
      }
    } finally {
      setConnecting(null);
    }
  };

  const isWalletInstalled = (walletId: string) => {
    if (typeof window === 'undefined') return false;

    // Check for wallet-specific objects
    switch (walletId) {
      case 'leather':
        return !!(window as any).LeatherProvider || !!(window as any).HiroWalletProvider;
      case 'xverse':
        return !!(window as any).XverseProviders;
      case 'hiro':
        return !!(window as any).HiroWalletProvider;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Wallet List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {SUPPORTED_WALLETS.map((wallet) => {
            const installed = isWalletInstalled(wallet.id);
            const isConnecting = connecting === wallet.id;

            return (
              <button
                key={wallet.id}
                onClick={() => handleWalletConnect(wallet.id)}
                disabled={isConnecting}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Wallet Icon Placeholder */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {wallet.name.charAt(0)}
                    </div>

                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{wallet.name}</h3>
                        {installed && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Installed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{wallet.description}</p>

                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        {wallet.mobile && (
                          <span className="flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            Mobile
                          </span>
                        )}
                        {wallet.desktop && (
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            Desktop
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isConnecting && (
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              New to Stacks?{' '}
              <a
                href="https://www.stacks.co/explore/wallets"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
              >
                Learn about wallets
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Wallet Connect Button with Modal Trigger
 */
export function WalletConnectButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useWalletStore();

  if (isConnected) return null;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Connect Wallet
      </button>

      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
