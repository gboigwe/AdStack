// Tests for Stacks React hooks
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStacksSession } from '../hooks/useStacksSession';

describe('useStacksSession', () => {
  beforeEach(() => { localStorage.clear(); });
  it('starts with no user', () => {
    const { result } = renderHook(() => useStacksSession());
    expect(result.current.user).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });
  it('connects user and sets isConnected', () => {
    const { result } = renderHook(() => useStacksSession());
    act(() => {
      result.current.connect({ stxAddress: 'SP123', network: 'mainnet' });
    });
    expect(result.current.isConnected).toBe(true);
    expect(result.current.user?.stxAddress).toBe('SP123');
  });
