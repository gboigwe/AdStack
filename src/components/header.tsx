'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useWalletStore } from '@/store/wallet-store';
import { WalletConnectButton } from './wallet/WalletModal';
import { AccountSwitcher } from './wallet/AccountSwitcher';
import { ThemeToggle } from './ui/ThemeToggle';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/advertiser', label: 'Advertiser' },
  { href: '/publisher', label: 'Publisher' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/governance', label: 'Governance' },
] as const;

export function Header() {
  const { address, isConnected, setAddress, setConnected } = useWalletStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    const reconnect = async () => {
      const { autoReconnectWallet } = await import('@/lib/wallet-session');
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">AdStack</h1>
            </Link>

            <nav className="hidden md:flex items-center space-x-6" aria-label="Main navigation">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`transition-colors font-medium ${
                      isActive
                        ? 'text-blue-600 border-b-2 border-blue-600 pb-0.5'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isConnected && address ? <AccountSwitcher /> : <WalletConnectButton />}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-nav" className="md:hidden border-t border-gray-200 py-4" role="navigation" aria-label="Mobile navigation">
            <nav className="flex flex-col space-y-4">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`transition-colors font-medium px-2 py-1 rounded-md ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-gray-200">
                {isConnected && address ? <AccountSwitcher className="w-full" /> : <WalletConnectButton />}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
