import type { Metadata } from 'next';

const SITE_NAME = 'AdStack';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://adstack.io';
const DEFAULT_DESCRIPTION =
  'Decentralized advertising platform built on Stacks, secured by Bitcoin. Connect advertisers and publishers through transparent smart contracts.';
const DEFAULT_OG_IMAGE = '/og-default.png';

interface MetadataInput {
  title?: string;
  description?: string;
  path?: string;
  /** Override the OG image path (relative or absolute URL) */
  ogImage?: string;
  /** Prevent search engine indexing */
  noIndex?: boolean;
}

/**
 * Create consistent page metadata for Next.js App Router.
 *
 * Merges page-specific values with site-wide defaults and generates
 * canonical URLs, Open Graph images, and Twitter card metadata.
 */
export function createMetadata(page: MetadataInput = {}): Metadata {
  const title = page.title
    ? `${page.title} | ${SITE_NAME}`
    : `${SITE_NAME} - Decentralized Advertising Platform`;
  const description = page.description || DEFAULT_DESCRIPTION;
  const url = page.path ? `${SITE_URL}${page.path}` : SITE_URL;
  const ogImage = page.ogImage || DEFAULT_OG_IMAGE;
  const imageUrl = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      url,
      type: 'website',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: page.title || SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    ...(page.noIndex && { robots: { index: false, follow: false } }),
  };
}

/**
 * Build JSON-LD structured data for a WebPage.
 * Returns a plain object to be serialized with JSON.stringify
 * and rendered in a script tag with type="application/ld+json".
 */
export function buildJsonLd(page: Pick<MetadataInput, 'title' | 'description' | 'path'>) {
  const url = page.path ? `${SITE_URL}${page.path}` : SITE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title ? `${page.title} | ${SITE_NAME}` : SITE_NAME,
    description: page.description || DEFAULT_DESCRIPTION,
    url,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}
