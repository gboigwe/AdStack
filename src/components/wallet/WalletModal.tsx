/**
 * Multi-Wallet Connection Modal
 * Displays all supported Stacks wallets with connection options
 */

'use client';

import { useState } from 'react';
import { ExternalLink, Smartphone, Monitor, Check } from 'lucide-react';
import { SUPPORTED_WALLETS } from '@/lib/appkit-config';
import { connectWallet } from '@/lib/wallet';
import { useWalletStore } from '@/store/wallet-store';
import { parseStacksError } from '@/lib/error-handler';
import { useToastStore } from '@/store/toast-store';
import { Modal } from '@/components/ui';

/** Extend Window with known Stacks wallet provider globals. */
interface StacksWalletWindow extends Window {
  LeatherProvider?: unknown;
  HiroWalletProvider?: unknown;
  XverseProviders?: unknown;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setAddress, setConnected } = useWalletStore();
  const addToast = useToastStore((s) => s.addToast);

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

        addToast({
          type: 'success',
          title: 'Wallet Connected',
          message: `Connected to ${address.slice(0, 8)}...${address.slice(-4)}`,
        });

        onClose();
      }
    } catch (err: unknown) {
      const parsedError = parseStacksError(err);
      if (parsedError.code !== 'USER_REJECTED') {
        setError(parsedError.message);
        addToast({
          type: 'error',
          title: 'Connection Failed',
          message: parsedError.message,
        });
      }
    } finally {
      setConnecting(null);
    }
  };

  const isWalletInstalled = (walletId: string): boolean => {
    if (typeof window === 'undefined') return false;

    const w = window as StacksWalletWindow;
    switch (walletId) {
      case 'leather':
        return !!w.LeatherProvider || !!w.HiroWalletProvider;
      case 'xverse':
        return !!w.XverseProviders;
      case 'hiro':
        return !!w.HiroWalletProvider;
      default:
        return false;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Wallet List */}
      <div className="space-y-3">
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
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
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
    </Modal>
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
