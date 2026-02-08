'use client';

import { useState, useEffect } from 'react';
import { Download, Eye, Receipt, Search, Filter, Calendar } from 'lucide-react';
import type { Invoice } from './types';

interface BillingHistoryProps {
  onViewInvoice?: (invoice: Invoice) => void;
  onDownloadInvoice?: (invoice: Invoice) => void;
}

export function BillingHistory({ onViewInvoice, onDownloadInvoice }: BillingHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // TODO: Fetch invoices from API
      // Placeholder data
      setInvoices([
        {
          id: 'inv_1',
          number: 'INV-2024-001',
          status: 'paid',
          amount: 149,
          tax: 14.9,
          total: 163.9,
          currency: 'USD',
          date: new Date('2024-02-01'),
          dueDate: new Date('2024-02-15'),
          paidDate: new Date('2024-02-03'),
          description: 'Pro Plan - Monthly',
          lineItems: [
            {
              id: 'li_1',
              description: 'Pro Plan - Monthly Subscription',
              quantity: 1,
              unitPrice: 149,
              amount: 149,
            },
          ],
          downloadUrl: '#',
        },
        {
          id: 'inv_2',
          number: 'INV-2024-002',
          status: 'paid',
          amount: 149,
          tax: 14.9,
          total: 163.9,
          currency: 'USD',
          date: new Date('2024-01-01'),
          dueDate: new Date('2024-01-15'),
          paidDate: new Date('2024-01-02'),
          description: 'Pro Plan - Monthly',
          lineItems: [
            {
              id: 'li_2',
              description: 'Pro Plan - Monthly Subscription',
              quantity: 1,
              unitPrice: 149,
              amount: 149,
            },
          ],
          downloadUrl: '#',
        },
        {
          id: 'inv_3',
          number: 'INV-2023-012',
          status: 'paid',
          amount: 1430,
          tax: 143,
          total: 1573,
          currency: 'USD',
          date: new Date('2023-12-01'),
          dueDate: new Date('2023-12-15'),
          paidDate: new Date('2023-12-05'),
          description: 'Pro Plan - Yearly',
          lineItems: [
            {
              id: 'li_3',
              description: 'Pro Plan - Yearly Subscription',
              quantity: 1,
              unitPrice: 1430,
              amount: 1430,
            },
          ],
          downloadUrl: '#',
        },
      ]);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      searchQuery === '' ||
      invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const totalPaid = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing History</h1>
        <p className="text-gray-600">View and download your invoices and payment history</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Paid</span>
            <Receipt className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${totalPaid.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Invoices</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
          <p className="text-sm text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Latest Payment</span>
            <Download className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${invoices[0]?.total.toFixed(2) || '0.00'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {invoices[0] ? formatDate(invoices[0].date) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              {['all', 'paid', 'pending', 'failed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status as any)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Invoices Found</h3>
            <p className="text-gray-600">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : "You don't have any invoices yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invoice.number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(invoice.date)}</div>
                      {invoice.paidDate && (
                        <div className="text-xs text-gray-500">
                          Paid {formatDate(invoice.paidDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{invoice.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ${invoice.total.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        ${invoice.amount.toFixed(2)} + ${invoice.tax.toFixed(2)} tax
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onViewInvoice?.(invoice)}
                          className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDownloadInvoice?.(invoice)}
                          className="text-gray-600 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Download Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Need help?</strong> Contact our support team if you have questions about your
          billing or need a custom invoice format.
        </p>
      </div>
    </div>
  );
}
