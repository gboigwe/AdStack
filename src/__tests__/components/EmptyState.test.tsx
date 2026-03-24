import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/ui';
import { Search } from 'lucide-react';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No campaigns found" />);
    expect(screen.getByText('No campaigns found')).toBeDefined();
  });

  it('renders the description when provided', () => {
    render(
      <EmptyState
        title="Empty"
        description="Create your first campaign to get started."
      />,
    );
    expect(screen.getByText('Create your first campaign to get started.')).toBeDefined();
  });

  it('does not render description when omitted', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs.length).toBe(0);
  });

  it('renders an action element when provided', () => {
    render(
      <EmptyState
        title="No results"
        action={<button>Create Campaign</button>}
      />,
    );
    expect(screen.getByText('Create Campaign')).toBeDefined();
  });

  it('renders with a custom icon', () => {
    const { container } = render(
      <EmptyState title="No search results" icon={Search} />,
    );
    // The icon should be rendered as an SVG
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('uses Inbox as default icon', () => {
    const { container } = render(<EmptyState title="Empty" />);
    // Default Inbox icon renders an SVG
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('centers content', () => {
    const { container } = render(<EmptyState title="Centered" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('text-center');
  });
});
