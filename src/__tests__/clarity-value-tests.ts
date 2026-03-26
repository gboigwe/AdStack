// Unit tests for Clarity value factories
import { describe, it, expect } from 'vitest';
import { makeUint, makeInt, makeBool, makePrincipal, makeNone, makeSome } from '../lib/clarity-v4/clarity-primitives';

describe('makeUint', () => {
  it('creates uint with correct type tag', () => {
    const v = makeUint(42n);
    expect(v.type).toBe('uint');
    expect(v.value).toBe(42n);
  });
  it('accepts number input', () => {
    const v = makeUint(100);
    expect(v.value).toBe(100n);
  });
