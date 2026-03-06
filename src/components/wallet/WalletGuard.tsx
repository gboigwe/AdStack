'use client';

import { type ReactNode } from 'react';
import { Wallet } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { WalletConnectButton } from './WalletModal';

interface WalletGuardProps {
  children: ReactNode;
  /** Title shown when wallet is not connected */
  title?: string;
  /** Description shown when wallet is not connected */
  description?: string;
}

/**
 * Guard component that renders children only when a wallet is connected.
 * Shows a centered connect prompt otherwise.
 *
 * This eliminates the need for every protected page to duplicate
 * the "Connect Your Wallet" check and UI.
 *
 * @example
 * <WalletGuard title="Advertiser Dashboard">
 *   <DashboardContent />
 * </WalletGuard>
 */
export function WalletGuard({
  children,
  title = 'Connect Your Wallet',
  description = 'Please connect your Stacks wallet to continue.',
}: WalletGuardProps) {
  const { isConnected } = useWalletStore();

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {title}
          </h2>
          <p className="text-gray-600 mb-6">
            {description}
          </p>
          <WalletConnectButton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
