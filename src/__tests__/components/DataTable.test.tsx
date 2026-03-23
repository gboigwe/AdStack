import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type Column } from '@/components/ui/DataTable';

interface TestRow {
  id: string;
  name: string;
  status: string;
}

const columns: Column<TestRow>[] = [
  { key: 'name', header: 'Name', render: (row) => row.name },
  { key: 'status', header: 'Status', render: (row) => row.status },
];

const data: TestRow[] = [
  { id: '1', name: 'Campaign Alpha', status: 'Active' },
  { id: '2', name: 'Campaign Beta', status: 'Paused' },
  { id: '3', name: 'Campaign Gamma', status: 'Completed' },
];

const getRowKey = (row: TestRow) => row.id;

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} getRowKey={getRowKey} />);
    expect(screen.getByText('Name')).toBeDefined();
    expect(screen.getByText('Status')).toBeDefined();
  });

  it('renders all data rows', () => {
    render(<DataTable columns={columns} data={data} getRowKey={getRowKey} />);
    expect(screen.getByText('Campaign Alpha')).toBeDefined();
    expect(screen.getByText('Campaign Beta')).toBeDefined();
    expect(screen.getByText('Campaign Gamma')).toBeDefined();
  });

  it('renders headers with scope="col"', () => {
    const { container } = render(
      <DataTable columns={columns} data={data} getRowKey={getRowKey} />,
    );
    const headers = container.querySelectorAll('th[scope="col"]');
    expect(headers.length).toBe(2);
  });

  it('shows empty message when data is empty', () => {
    render(<DataTable columns={columns} data={[]} getRowKey={getRowKey} />);
    expect(screen.getByText('No data found')).toBeDefined();
  });

  it('shows custom empty message', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        getRowKey={getRowKey}
        emptyMessage="No campaigns to display"
      />,
    );
    expect(screen.getByText('No campaigns to display')).toBeDefined();
  });

  it('shows skeleton rows when isLoading', () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} getRowKey={getRowKey} isLoading />,
    );
    expect(screen.getByText('Loading data…')).toBeDefined();
    // Default 5 skeleton rows
    const skeletonRows = container.querySelectorAll('tr[class*="border-b"]');
    expect(skeletonRows.length).toBeGreaterThanOrEqual(5);
  });

  it('shows custom number of loading rows', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        getRowKey={getRowKey}
        isLoading
        loadingRows={3}
      />,
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    // 3 rows × 2 columns = 6 skeleton cells
    expect(skeletons.length).toBe(6);
  });

  it('sets aria-busy on table when loading', () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} getRowKey={getRowKey} isLoading />,
    );
    const table = container.querySelector('table');
    expect(table?.getAttribute('aria-busy')).toBe('true');
  });

  it('calls onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        getRowKey={getRowKey}
        onRowClick={onRowClick}
      />,
    );
    fireEvent.click(screen.getByText('Campaign Alpha'));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('makes rows keyboard-accessible when onRowClick is provided', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        getRowKey={getRowKey}
        onRowClick={onRowClick}
      />,
    );
    const row = screen.getByText('Campaign Alpha').closest('tr');
    expect(row?.tabIndex).toBe(0);
    expect(row?.getAttribute('role')).toBe('button');
  });

  it('fires onRowClick on Enter key', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        getRowKey={getRowKey}
        onRowClick={onRowClick}
      />,
    );
    const row = screen.getByText('Campaign Alpha').closest('tr')!;
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('applies striped row styling', () => {
    render(
      <DataTable columns={columns} data={data} getRowKey={getRowKey} striped />,
    );
    const secondRow = screen.getByText('Campaign Beta').closest('tr');
    expect(secondRow?.className).toContain('bg-gray-50/50');
  });

  it('sets aria-label on the region wrapper', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        getRowKey={getRowKey}
        ariaLabel="Campaigns table"
      />,
    );
    expect(screen.getByLabelText('Campaigns table')).toBeDefined();
  });
});
