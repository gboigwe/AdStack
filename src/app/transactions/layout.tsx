import { createMetadata } from '@/lib/metadata';

export const metadata = createMetadata({
  title: 'Transactions',
  description:
    'View your complete Stacks transaction history. Track contract calls, transfers, and pending transactions in real time.',
  path: '/transactions',
});

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
