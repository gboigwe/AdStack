import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Tooltip } from '@/components/ui/Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders children', () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByText('Hover me')).toBeDefined();
  });

  it('does not show tooltip initially', () => {
    render(
      <Tooltip content="Help text">
        <span>Trigger</span>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows tooltip after hover and delay', () => {
    render(
      <Tooltip content="Help text" delay={200}>
        <span>Trigger</span>
      </Tooltip>,
    );

    const trigger = screen.getByText('Trigger').closest('span[class*="relative"]')!;
    fireEvent.mouseEnter(trigger);

    // Not visible yet before delay
    expect(screen.queryByRole('tooltip')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByRole('tooltip')).toBeDefined();
    expect(screen.getByText('Help text')).toBeDefined();
  });

  it('hides tooltip on mouse leave', () => {
    render(
      <Tooltip content="Tip" delay={0}>
        <span>Trigger</span>
      </Tooltip>,
    );

    const trigger = screen.getByText('Trigger').closest('span[class*="relative"]')!;
    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole('tooltip')).toBeDefined();

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows tooltip on focus', () => {
    render(
      <Tooltip content="Focus tip" delay={100}>
        <button>Focus me</button>
      </Tooltip>,
    );

    const trigger = screen.getByText('Focus me').closest('span[class*="relative"]')!;
    fireEvent.focus(trigger);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByRole('tooltip')).toBeDefined();
    expect(screen.getByText('Focus tip')).toBeDefined();
  });

  it('hides tooltip on blur', () => {
    render(
      <Tooltip content="Tip" delay={0}>
        <button>Btn</button>
      </Tooltip>,
    );

    const trigger = screen.getByText('Btn').closest('span[class*="relative"]')!;
    fireEvent.focus(trigger);
    act(() => { vi.advanceTimersByTime(0); });

    expect(screen.getByRole('tooltip')).toBeDefined();

    fireEvent.blur(trigger);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('sets aria-describedby when tooltip is visible', () => {
    render(
      <Tooltip content="Description" delay={0}>
        <span>Target</span>
      </Tooltip>,
    );

    const trigger = screen.getByText('Target').closest('span[class*="relative"]')!;

    // No aria-describedby before showing
    expect(trigger.getAttribute('aria-describedby')).toBeNull();

    fireEvent.mouseEnter(trigger);
    act(() => { vi.advanceTimersByTime(0); });

    // aria-describedby should now point to the tooltip
    const tooltipId = screen.getByRole('tooltip').id;
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltipId);
  });

  it('uses default delay of 200ms', () => {
    render(
      <Tooltip content="Default delay">
        <span>Trigger</span>
      </Tooltip>,
    );

    const trigger = screen.getByText('Trigger').closest('span[class*="relative"]')!;
    fireEvent.mouseEnter(trigger);

    act(() => { vi.advanceTimersByTime(199); });
    expect(screen.queryByRole('tooltip')).toBeNull();

    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByRole('tooltip')).toBeDefined();
  });

  it('cancels pending show on mouse leave before delay', () => {
    render(
      <Tooltip content="Cancelled" delay={300}>
        <span>Trigger</span>
      </Tooltip>,
    );

    const trigger = screen.getByText('Trigger').closest('span[class*="relative"]')!;
    fireEvent.mouseEnter(trigger);

    act(() => { vi.advanceTimersByTime(100); });

    fireEvent.mouseLeave(trigger);

    act(() => { vi.advanceTimersByTime(300); });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
