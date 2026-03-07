import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Publisher Settings',
  description:
    'Configure your AdStack publisher profile, website preferences, content categories, and notification settings.',
  path: '/publisher/settings',
});

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
