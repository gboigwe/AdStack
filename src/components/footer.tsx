import { memo } from 'react';
import Link from 'next/link';

const FOOTER_LINKS = {
  Platform: [
    { label: 'Advertiser', href: '/advertiser' },
    { label: 'Publisher', href: '/publisher' },
    { label: 'Governance', href: '/governance' },
    { label: 'Transactions', href: '/transactions' },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'Smart Contracts', href: '#' },
    { label: 'Status', href: '#' },
  ],
  Community: [
    { label: 'GitHub', href: 'https://github.com/gboigwe/AdStack' },
    { label: 'Discord', href: '#' },
    { label: 'Twitter', href: '#' },
  ],
} as const;

/** Computed once at module load — avoids Date creation on every render. */
const CURRENT_YEAR = new Date().getFullYear();

export const Footer = memo(function Footer() {

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-white">AdStack</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Decentralized advertising built on Stacks, secured by Bitcoin.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-white mb-3">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('http') ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">
            &copy; {CURRENT_YEAR} AdStack. All rights reserved.
          </p>
          <p className="text-xs">
            Powered by{' '}
            <a
              href="https://www.stacks.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Stacks
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
});
