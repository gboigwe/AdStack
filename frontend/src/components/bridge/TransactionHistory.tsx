import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Search, Filter, Download } from 'lucide-react';

interface BridgeTransaction {
  id: string;
  txHash: string;
  fromChain: string;
  toChain: string;
  token: string;
  amount: string;
  fee: string;
  status: 'pending' | 'validating' | 'completed' | 'failed';
  timestamp: number;
  validators: number;
  requiredValidators: number;
}

const mockTransactions: BridgeTransaction[] = [
  {
    id: '1',
    txHash: '0xabcd...1234',
    fromChain: 'Ethereum',
    toChain: 'Stacks',
    token: 'USDC',
    amount: '1000.00',
    fee: '3.00',
    status: 'completed',
    timestamp: Date.now() - 3600000,
    validators: 5,
    requiredValidators: 3,
  },
  {
    id: '2',
    txHash: '0xef56...5678',
    fromChain: 'Polygon',
    toChain: 'Stacks',
    token: 'USDT',
    amount: '500.00',
    fee: '1.50',
    status: 'validating',
    timestamp: Date.now() - 1800000,
    validators: 2,
    requiredValidators: 3,
  },
  {
    id: '3',
    txHash: '0x7890...abcd',
    fromChain: 'Stacks',
    toChain: 'Ethereum',
    token: 'USDC',
    amount: '250.00',
    fee: '0.75',
    status: 'pending',
    timestamp: Date.now() - 900000,
    validators: 0,
    requiredValidators: 3,
  },
];

export default function TransactionHistory() {
  const [transactions] = useState<BridgeTransaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getStatusBadge = (status: BridgeTransaction['status']) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      validating: { variant: 'default' as const, label: 'Validating' },
      completed: { variant: 'default' as const, label: 'Completed', className: 'bg-green-500' },
      failed: { variant: 'destructive' as const, label: 'Failed' },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch =
      tx.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.fromChain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.toChain.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    // Export transactions as CSV
    const csv = [
      ['Tx Hash', 'From', 'To', 'Token', 'Amount', 'Fee', 'Status', 'Time'],
      ...transactions.map(tx => [
        tx.txHash,
        tx.fromChain,
        tx.toChain,
        tx.token,
        tx.amount,
        tx.fee,
        tx.status,
        new Date(tx.timestamp).toISOString(),
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bridge-transactions-${Date.now()}.csv`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Track your cross-chain bridge transactions</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tx hash, token, or chain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === 'validating' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('validating')}
            >
              Validating
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tx Hash</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Token</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validators</TableHead>
                <TableHead>Time</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-sm">
                      {tx.txHash}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{tx.fromChain}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-sm">{tx.toChain}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.token}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {tx.amount}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {tx.fee}
                    </TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className={tx.validators >= tx.requiredValidators ? 'text-green-600' : ''}>
                          {tx.validators}
                        </span>
                        <span className="text-muted-foreground">/{tx.requiredValidators}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(tx.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Total Volume</div>
            <div className="text-2xl font-bold">
              ${transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Total Fees</div>
            <div className="text-2xl font-bold">
              ${transactions.reduce((sum, tx) => sum + parseFloat(tx.fee), 0).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold">
              {transactions.filter(tx => tx.status === 'completed').length}
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold">
              {transactions.filter(tx => tx.status !== 'completed' && tx.status !== 'failed').length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
