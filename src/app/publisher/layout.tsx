import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Publisher Dashboard',
  description:
    'Monetize your website with AdStack. Track earnings, manage ad placements, and configure your publisher settings.',
  path: '/publisher',
});

export default function PublisherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
