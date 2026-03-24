import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';

const sampleTabs: TabItem[] = [
  { key: 'overview', label: 'Overview', content: <p>Overview content</p> },
  { key: 'details', label: 'Details', count: 5, content: <p>Details content</p> },
  { key: 'settings', label: 'Settings', content: <p>Settings content</p> },
];

describe('Tabs', () => {
  it('renders all tab buttons', () => {
    render(<Tabs tabs={sampleTabs} />);
    expect(screen.getByText('Overview')).toBeDefined();
    expect(screen.getByText('Details')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });

  it('renders tablist with correct role', () => {
    render(<Tabs tabs={sampleTabs} />);
    expect(screen.getByRole('tablist')).toBeDefined();
  });

  it('shows first tab content by default in uncontrolled mode', () => {
    render(<Tabs tabs={sampleTabs} />);
    expect(screen.getByText('Overview content')).toBeDefined();
  });

  it('marks first tab as selected by default', () => {
    render(<Tabs tabs={sampleTabs} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
  });

  it('switches tab on click in uncontrolled mode', () => {
    render(<Tabs tabs={sampleTabs} />);
    fireEvent.click(screen.getByText('Details'));
    expect(screen.getByText('Details content')).toBeDefined();
  });

  it('calls onChange when a tab is clicked', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={sampleTabs} onChange={onChange} />);
    fireEvent.click(screen.getByText('Settings'));
    expect(onChange).toHaveBeenCalledWith('settings');
  });

  it('uses controlled activeKey', () => {
    render(<Tabs tabs={sampleTabs} activeKey="settings" />);
    expect(screen.getByText('Settings content')).toBeDefined();
    const tabs = screen.getAllByRole('tab');
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
  });

  it('renders count badge', () => {
    render(<Tabs tabs={sampleTabs} />);
    expect(screen.getByText('5')).toBeDefined();
  });

  it('sets tabIndex=0 on active tab and -1 on inactive', () => {
    render(<Tabs tabs={sampleTabs} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0].tabIndex).toBe(0);
    expect(tabs[1].tabIndex).toBe(-1);
    expect(tabs[2].tabIndex).toBe(-1);
  });

  it('navigates with ArrowRight key', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={sampleTabs} onChange={onChange} />);
    const firstTab = screen.getAllByRole('tab')[0];
    fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('details');
  });

  it('navigates with ArrowLeft key and wraps around', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={sampleTabs} onChange={onChange} />);
    const firstTab = screen.getAllByRole('tab')[0];
    fireEvent.keyDown(firstTab, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('settings');
  });

  it('navigates to first tab with Home key', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={sampleTabs} activeKey="settings" onChange={onChange} />);
    const lastTab = screen.getAllByRole('tab')[2];
    fireEvent.keyDown(lastTab, { key: 'Home' });
    expect(onChange).toHaveBeenCalledWith('overview');
  });

  it('navigates to last tab with End key', () => {
    const onChange = vi.fn();
    render(<Tabs tabs={sampleTabs} onChange={onChange} />);
    const firstTab = screen.getAllByRole('tab')[0];
    fireEvent.keyDown(firstTab, { key: 'End' });
    expect(onChange).toHaveBeenCalledWith('settings');
  });

  it('renders tabpanel with correct role', () => {
    render(<Tabs tabs={sampleTabs} />);
    expect(screen.getByRole('tabpanel')).toBeDefined();
  });

  it('merges custom className', () => {
    const { container } = render(<Tabs tabs={sampleTabs} className="mt-6" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('mt-6');
  });
});
