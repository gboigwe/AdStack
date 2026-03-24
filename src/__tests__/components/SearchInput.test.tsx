import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchInput } from '@/components/ui';

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with default placeholder', () => {
    render(<SearchInput />);
    expect(screen.getByPlaceholderText('Search…')).toBeDefined();
  });

  it('renders with custom placeholder', () => {
    render(<SearchInput placeholder="Find campaigns..." />);
    expect(screen.getByPlaceholderText('Find campaigns...')).toBeDefined();
  });

  it('calls onChange after debounce delay', () => {
    const onChange = vi.fn();
    render(<SearchInput onChange={onChange} debounce={300} />);

    const input = screen.getByPlaceholderText('Search…');
    fireEvent.change(input, { target: { value: 'hello' } });

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('calls onChange immediately when debounce=0', () => {
    const onChange = vi.fn();
    render(<SearchInput onChange={onChange} debounce={0} />);

    const input = screen.getByPlaceholderText('Search…');
    fireEvent.change(input, { target: { value: 'test' } });

    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('shows clear button when input has value', () => {
    render(<SearchInput value="hello" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Clear search')).toBeDefined();
  });

  it('does not show clear button when empty', () => {
    render(<SearchInput value="" onChange={vi.fn()} />);
    expect(screen.queryByLabelText('Clear search')).toBeNull();
  });

  it('clears input and calls onChange with empty string on clear', () => {
    const onChange = vi.fn();
    render(<SearchInput value="hello" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText('Clear search'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('works in uncontrolled mode', () => {
    render(<SearchInput />);
    const input = screen.getByPlaceholderText('Search…') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'uncontrolled' } });
    expect(input.value).toBe('uncontrolled');
  });
});
