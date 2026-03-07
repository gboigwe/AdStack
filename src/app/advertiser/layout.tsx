import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Advertiser Dashboard',
  description:
    'Manage your advertising campaigns on AdStack. Create, monitor, and optimize decentralized ad campaigns powered by Stacks.',
  path: '/advertiser',
});

export default function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
