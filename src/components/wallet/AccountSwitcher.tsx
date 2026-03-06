/**
 * Account and Network Switcher Component
 * Allows users to switch between accounts and networks
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe, Copy, ExternalLink, LogOut } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { disconnectWallet, getWalletAddress } from '@/lib/wallet';
import { truncateAddress, formatSTXWithSymbol } from '@/lib/display-utils';
import { CURRENT_NETWORK, NetworkType } from '@/lib/stacks-config';
import { copyToClipboard } from '@/lib/display-utils';
import { fetchStxBalance } from '@/lib/stacks-api';

interface AccountSwitcherProps {
  className?: string;
}

export function AccountSwitcher({ className = '' }: AccountSwitcherProps) {
  const { address, isConnected, disconnect } = useWalletStore();
  const [isOpen, setIsOpen] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType>(CURRENT_NETWORK);
  const [balance, setBalance] = useState<bigint>(0n);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch STX balance using the centralized API client
  useEffect(() => {
    if (!address || !isConnected) return;

    let cancelled = false;

    async function loadBalance() {
      const result = await fetchStxBalance(address!);
      if (!cancelled && result.ok && result.data) {
        setBalance(BigInt(result.data.balance));
      }
    }

    loadBalance();
    return () => { cancelled = true; };
  }, [address, isConnected]);

  if (!isConnected || !address) {
    return null;
  }

  const handleCopyAddress = async () => {
    const success = await copyToClipboard(address);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    disconnect();
    setIsOpen(false);
  };

  const handleNetworkSwitch = (network: NetworkType) => {
    if (network === CURRENT_NETWORK) return;

    // Network is set via NEXT_PUBLIC_NETWORK env var which is baked into
    // the client bundle at build time. At runtime we can't change it
    // without a new build, so we store the user's preference and prompt
    // a reload. On local dev the .env.local can be switched manually.
    setCurrentNetwork(network);

    const confirmed = window.confirm(
      `Switching to ${network} requires a page reload. Continue?`,
    );
    if (confirmed) {
      // Persist preference so the app can read it after reload
      localStorage.setItem('adstack_preferred_network', network);
      window.location.reload();
    } else {
      setCurrentNetwork(CURRENT_NETWORK);
    }
  };

  const openExplorer = () => {
    const explorerUrl =
      currentNetwork === 'mainnet'
        ? `https://explorer.hiro.so/address/${address}`
        : `https://explorer.hiro.so/address/${address}?chain=testnet`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Account Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
      >
        {/* Network Indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              currentNetwork === 'mainnet' ? 'bg-green-500' : 'bg-orange-500'
            }`}
          />
          <span className="text-sm font-medium text-gray-700 capitalize">{currentNetwork}</span>
        </div>

        {/* Address */}
        <span className="text-sm font-mono text-gray-900">{truncateAddress(address)}</span>

        {/* Dropdown Icon */}
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Account Info */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 font-medium">Connected Account</span>
              <button
                onClick={handleCopyAddress}
                className="p-1.5 hover:bg-white rounded-lg transition-colors group"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                )}
              </button>
            </div>

            <div className="font-mono text-sm text-gray-900 bg-white px-3 py-2 rounded-lg mb-3">
              {address}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">
                {formatSTXWithSymbol(balance, 2)}
              </span>
              <button
                onClick={openExplorer}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Explorer
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Network Switcher */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Network</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['mainnet', 'testnet'] as const).map((network) => (
                <button
                  key={network}
                  onClick={() => handleNetworkSwitch(network)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentNetwork === network
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {currentNetwork === network && <Check className="w-4 h-4" />}
                    <span className="capitalize">{network}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={handleDisconnect}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
