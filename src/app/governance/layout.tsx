import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Governance',
  description:
    'Participate in AdStack protocol governance. Vote on proposals, submit new ideas, and shape the future of decentralized advertising.',
  path: '/governance',
});

export default function GovernanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
