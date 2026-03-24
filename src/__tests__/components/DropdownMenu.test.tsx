import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DropdownMenu } from '@/components/ui/DropdownMenu';

// Stub useClickOutside to avoid ref issues in test environment
vi.mock('@/hooks', () => ({
  useClickOutside: () => {},
}));

const sampleItems = [
  { key: 'edit', label: 'Edit', onClick: vi.fn() },
  { key: 'duplicate', label: 'Duplicate', onClick: vi.fn() },
  { key: 'delete', label: 'Delete', onClick: vi.fn(), danger: true },
];

describe('DropdownMenu', () => {
  it('renders trigger button with aria attributes', () => {
    render(<DropdownMenu items={sampleItems} />);
    const trigger = screen.getByLabelText('Actions menu');
    expect(trigger.getAttribute('aria-haspopup')).toBe('true');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens menu on trigger click', () => {
    render(<DropdownMenu items={sampleItems} />);
    fireEvent.click(screen.getByLabelText('Actions menu'));
    expect(screen.getByRole('menu')).toBeDefined();
  });

  it('shows all menu items when open', () => {
    render(<DropdownMenu items={sampleItems} />);
    fireEvent.click(screen.getByLabelText('Actions menu'));
    expect(screen.getByText('Edit')).toBeDefined();
    expect(screen.getByText('Duplicate')).toBeDefined();
    expect(screen.getByText('Delete')).toBeDefined();
  });

  it('sets aria-expanded to true when open', () => {
    render(<DropdownMenu items={sampleItems} />);
    fireEvent.click(screen.getByLabelText('Actions menu'));
    expect(screen.getByLabelText('Actions menu').getAttribute('aria-expanded')).toBe('true');
  });

  it('calls item onClick and closes menu on item click', () => {
    const editFn = vi.fn();
    const items = [{ key: 'edit', label: 'Edit', onClick: editFn }];
    render(<DropdownMenu items={items} />);

    fireEvent.click(screen.getByLabelText('Actions menu'));
    fireEvent.click(screen.getByText('Edit'));

    expect(editFn).toHaveBeenCalledOnce();
    // Menu should close after click
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('toggles menu on repeated trigger clicks', () => {
    render(<DropdownMenu items={sampleItems} />);
    const trigger = screen.getByLabelText('Actions menu');

    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeDefined();

    fireEvent.click(trigger);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes menu on Escape key', () => {
    render(<DropdownMenu items={sampleItems} />);
    fireEvent.click(screen.getByLabelText('Actions menu'));
    expect(screen.getByRole('menu')).toBeDefined();

    fireEvent.keyDown(screen.getByLabelText('Actions menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('applies danger styles to danger items', () => {
    render(<DropdownMenu items={sampleItems} />);
    fireEvent.click(screen.getByLabelText('Actions menu'));
    const deleteBtn = screen.getByText('Delete');
    expect(deleteBtn.className).toContain('text-red-600');
  });

  it('renders disabled items', () => {
    const items = [
      { key: 'disabled', label: 'Disabled Action', onClick: vi.fn(), disabled: true },
    ];
    render(<DropdownMenu items={items} />);
    fireEvent.click(screen.getByLabelText('Actions menu'));
    const btn = screen.getByText('Disabled Action');
    expect(btn).toHaveProperty('disabled', true);
  });

  it('renders menu items with role="menuitem"', () => {
    render(<DropdownMenu items={sampleItems} />);
    fireEvent.click(screen.getByLabelText('Actions menu'));
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.length).toBe(3);
  });

  it('merges custom className', () => {
    const { container } = render(
      <DropdownMenu items={sampleItems} className="ml-auto" />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('ml-auto');
  });
});
