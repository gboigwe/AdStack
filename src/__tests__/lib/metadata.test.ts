import { describe, it, expect } from 'vitest';
import { createMetadata, buildJsonLd } from '@/lib/metadata';

describe('createMetadata', () => {
  it('uses site defaults when no page input is given', () => {
    const meta = createMetadata();
    expect(meta.title).toContain('AdStack');
    expect(meta.description).toContain('Decentralized advertising');
  });

  it('appends site name to page title', () => {
    const meta = createMetadata({ title: 'Dashboard' });
    expect(meta.title).toBe('Dashboard | AdStack');
  });

  it('uses page description when provided', () => {
    const meta = createMetadata({ description: 'Custom desc' });
    expect(meta.description).toBe('Custom desc');
  });

  it('builds canonical URL from path', () => {
    const meta = createMetadata({ path: '/campaigns' });
    expect(meta.alternates?.canonical).toContain('/campaigns');
  });

  it('sets Open Graph metadata', () => {
    const meta = createMetadata({ title: 'Campaigns', path: '/campaigns' });
    const og = meta.openGraph as Record<string, unknown>;
    expect(og.title).toBe('Campaigns | AdStack');
    expect(og.type).toBe('website');
    expect(og.siteName).toBe('AdStack');
  });

  it('sets Twitter card metadata', () => {
    const meta = createMetadata({ title: 'Test' });
    const twitter = meta.twitter as Record<string, unknown>;
    expect(twitter.card).toBe('summary_large_image');
    expect(twitter.title).toBe('Test | AdStack');
  });

  it('uses custom OG image', () => {
    const meta = createMetadata({ ogImage: '/custom-og.png' });
    const og = meta.openGraph as Record<string, unknown>;
    const images = og.images as Array<{ url: string }>;
    expect(images[0].url).toContain('custom-og.png');
  });

  it('handles absolute OG image URLs', () => {
    const meta = createMetadata({ ogImage: 'https://cdn.example.com/og.png' });
    const og = meta.openGraph as Record<string, unknown>;
    const images = og.images as Array<{ url: string }>;
    expect(images[0].url).toBe('https://cdn.example.com/og.png');
  });

  it('adds noIndex robots directive', () => {
    const meta = createMetadata({ noIndex: true });
    const robots = meta.robots as Record<string, boolean>;
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });

  it('does not add robots directive when noIndex is false', () => {
    const meta = createMetadata({ noIndex: false });
    expect(meta.robots).toBeUndefined();
  });
});

describe('buildJsonLd', () => {
  it('returns WebPage schema with site defaults', () => {
    const ld = buildJsonLd({});
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('WebPage');
    expect(ld.publisher.name).toBe('AdStack');
  });

  it('includes page title and description', () => {
    const ld = buildJsonLd({ title: 'Governance', description: 'Vote on proposals' });
    expect(ld.name).toBe('Governance | AdStack');
    expect(ld.description).toBe('Vote on proposals');
  });

  it('builds URL from path', () => {
    const ld = buildJsonLd({ path: '/governance' });
    expect(ld.url).toContain('/governance');
  });
});
