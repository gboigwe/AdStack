'use client';

import { type ReactNode } from 'react';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  /** Unique key for the column */
  key: string;
  /** Column header text */
  header: string;
  /** Render function for the cell content */
  render: (row: T, index: number) => ReactNode;
  /** Optional class for the header cell */
  headerClassName?: string;
  /** Optional class for each body cell */
  cellClassName?: string;
  /** Hide column below this breakpoint (sm, md, lg) */
  hideBelow?: 'sm' | 'md' | 'lg';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Unique key extractor for each row */
  getRowKey: (row: T, index: number) => string;
  isLoading?: boolean;
  /** Number of skeleton rows to show while loading */
  loadingRows?: number;
  /** Message shown when data is empty and not loading */
  emptyMessage?: string;
  /** Optional click handler for rows */
  onRowClick?: (row: T) => void;
  /** Striped rows */
  striped?: boolean;
}

const HIDE_CLASSES: Record<string, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  isLoading = false,
  loadingRows = 5,
  emptyMessage = 'No data found',
  onRowClick,
  striped = false,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${col.hideBelow ? HIDE_CLASSES[col.hideBelow] ?? '' : ''} ${col.headerClassName ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: loadingRows }, (_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-gray-100">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${col.hideBelow ? HIDE_CLASSES[col.hideBelow] ?? '' : ''}`}
                    >
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            : data.length === 0
              ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-12 text-center text-gray-500"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                )
              : data.map((row, idx) => (
                  <tr
                    key={getRowKey(row, idx)}
                    className={`border-b border-gray-100 transition-colors ${
                      onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                    } ${striped && idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${col.hideBelow ? HIDE_CLASSES[col.hideBelow] ?? '' : ''} ${col.cellClassName ?? ''}`}
                      >
                        {col.render(row, idx)}
                      </td>
                    ))}
                  </tr>
                ))}
        </tbody>
      </table>
    </div>
  );
}
