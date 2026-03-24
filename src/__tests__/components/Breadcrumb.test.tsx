import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumb } from '@/components/ui';

describe('Breadcrumb', () => {
  it('returns null for empty items', () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders a nav with aria-label', () => {
    render(<Breadcrumb items={[{ label: 'Home' }]} />);
    expect(screen.getByLabelText('Breadcrumb')).toBeDefined();
  });

  it('renders items as list elements', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Campaigns', href: '/campaigns' },
          { label: 'Details' },
        ]}
      />,
    );
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Campaigns')).toBeDefined();
    expect(screen.getByText('Details')).toBeDefined();
  });

  it('renders the last item as plain text with aria-current="page"', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Current Page' },
        ]}
      />,
    );
    const lastItem = screen.getByText('Current Page');
    expect(lastItem.getAttribute('aria-current')).toBe('page');
    expect(lastItem.tagName).toBe('SPAN');
  });

  it('renders non-last items with href as links', () => {
    render(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Page' },
        ]}
      />,
    );
    const link = screen.getByText('Home');
    expect(link.closest('a')).not.toBeNull();
  });

  it('does not show separator before the first item', () => {
    const { container } = render(
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Page' }]} />,
    );
    const listItems = container.querySelectorAll('li');
    // First li should not have an SVG chevron
    const firstSvg = listItems[0]?.querySelector('svg');
    expect(firstSvg).toBeNull();
  });

  it('shows separator between items', () => {
    const { container } = render(
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Page' }]} />,
    );
    const listItems = container.querySelectorAll('li');
    // Second li should have an SVG chevron separator
    const secondSvg = listItems[1]?.querySelector('svg');
    expect(secondSvg).not.toBeNull();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Breadcrumb items={[{ label: 'Home' }]} className="mb-4" />,
    );
    const nav = container.firstElementChild as HTMLElement;
    expect(nav.className).toContain('mb-4');
  });
});
