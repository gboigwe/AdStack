'use client';

import { Search, Filter, X } from 'lucide-react';

export type TxStatusFilter = 'all' | 'success' | 'pending' | 'failed';
export type TxTypeFilter = 'all' | 'token_transfer' | 'contract_call' | 'smart_contract';

interface TransactionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: TxStatusFilter;
  onStatusChange: (status: TxStatusFilter) => void;
  typeFilter: TxTypeFilter;
  onTypeChange: (type: TxTypeFilter) => void;
}

const STATUS_OPTIONS: { value: TxStatusFilter; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'success', label: 'Success' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const TYPE_OPTIONS: { value: TxTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'token_transfer', label: 'Transfers' },
  { value: 'contract_call', label: 'Contract Calls' },
  { value: 'smart_contract', label: 'Deploys' },
];

export function TransactionFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
}: TransactionFiltersProps) {
  const hasFilters = searchQuery || statusFilter !== 'all' || typeFilter !== 'all';

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by transaction hash..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          aria-label="Search transactions"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            aria-label="Clear search"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status:</span>
          <div className="flex gap-1" role="group" aria-label="Filter by status">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onStatusChange(opt.value)}
                aria-pressed={statusFilter === opt.value}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900 ${
                  statusFilter === opt.value
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-medium'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type:</span>
          <div className="flex gap-1" role="group" aria-label="Filter by type">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onTypeChange(opt.value)}
                aria-pressed={typeFilter === opt.value}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900 ${
                  typeFilter === opt.value
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-medium'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={() => {
              onSearchChange('');
              onStatusChange('all');
              onTypeChange('all');
            }}
            className="px-2.5 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
