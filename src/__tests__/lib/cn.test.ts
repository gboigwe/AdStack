import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/cn';

describe('cn', () => {
  it('joins multiple string arguments', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  it('filters out false values', () => {
    expect(cn('base', false && 'hidden')).toBe('base');
  });

  it('filters out null and undefined', () => {
    expect(cn('base', null, undefined, 'end')).toBe('base end');
  });

  it('filters out 0', () => {
    expect(cn('base', 0, 'end')).toBe('base end');
  });

  it('filters out empty strings', () => {
    expect(cn('base', '', 'end')).toBe('base end');
  });

  it('returns empty string when all inputs are falsy', () => {
    expect(cn(false, null, undefined, 0)).toBe('');
  });

  it('returns empty string with no arguments', () => {
    expect(cn()).toBe('');
  });

  it('works with conditional expressions', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('btn', isActive && 'btn-active', isDisabled && 'btn-disabled')).toBe(
      'btn btn-active',
    );
  });

  it('handles a single class name', () => {
    expect(cn('only')).toBe('only');
  });
});
