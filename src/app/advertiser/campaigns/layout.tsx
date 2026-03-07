import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Campaigns',
  description:
    'View and manage your advertising campaigns. Track impressions, clicks, and spending across all active and past campaigns.',
  path: '/advertiser/campaigns',
});

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
