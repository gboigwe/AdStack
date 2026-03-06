import type { Metadata } from 'next';

const SITE_NAME = 'AdStack';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://adstack.io';
const DEFAULT_DESCRIPTION =
  'Decentralized advertising platform built on Stacks, secured by Bitcoin. Connect advertisers and publishers through transparent smart contracts.';

/**
 * Create consistent page metadata for Next.js App Router.
 * Merges page-specific values with site-wide defaults.
 */
export function createMetadata(page: {
  title?: string;
  description?: string;
  path?: string;
}): Metadata {
  const title = page.title
    ? `${page.title} | ${SITE_NAME}`
    : `${SITE_NAME} - Decentralized Advertising Platform`;

  return {
    title,
    description: page.description || DEFAULT_DESCRIPTION,
    metadataBase: new URL(SITE_URL),
    openGraph: {
      title,
      description: page.description || DEFAULT_DESCRIPTION,
      siteName: SITE_NAME,
      url: page.path ? `${SITE_URL}${page.path}` : SITE_URL,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: page.description || DEFAULT_DESCRIPTION,
    },
  };
}
