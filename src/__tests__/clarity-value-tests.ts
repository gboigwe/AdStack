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
  it('throws for negative values', () => {
    expect(() => makeUint(-1n)).toThrow(RangeError);
  });
  it('throws when exceeding uint128 max', () => {
    const tooBig = 340282366920938463463374607431768211456n;
    expect(() => makeUint(tooBig)).toThrow(RangeError);
  });
});

describe('makeInt', () => {
  it('creates int with correct type tag', () => {
    const v = makeInt(-1n);
    expect(v.type).toBe('int');
    expect(v.value).toBe(-1n);
  });
  it('throws below min int128', () => {
    const tooSmall = -170141183460469231731687303715884105729n;
    expect(() => makeInt(tooSmall)).toThrow(RangeError);
  });
});
