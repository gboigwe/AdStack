import { describe, it, expect } from 'vitest';
import {
  toUIntCV,
  toIntCV,
  toBoolCV,
  toStringAsciiCV,
  toStringUtf8CV,
  toPrincipalCV,
  toListCV,
  toSomeCV,
  toNoneCV,
  cvToNumber,
  cvToBigInt,
  cvToString,
  cvToAddress,
  stacksBlockTimeToDate,
  dateToStacksBlockTime,
} from '@/lib/clarity-converters';

describe('clarity-converters', () => {
  describe('toUIntCV', () => {
    it('creates uint from number', () => {
      expect(toUIntCV(42)).toEqual({ type: 'uint', value: 42n });
    });

    it('creates uint from bigint', () => {
      expect(toUIntCV(100n)).toEqual({ type: 'uint', value: 100n });
    });

    it('floors decimal numbers', () => {
      expect(toUIntCV(3.7)).toEqual({ type: 'uint', value: 3n });
    });

    it('throws for negative values', () => {
      expect(() => toUIntCV(-1)).toThrow('UInt cannot be negative');
    });
  });

  describe('toIntCV', () => {
    it('creates int from negative number', () => {
      expect(toIntCV(-5)).toEqual({ type: 'int', value: -5n });
    });

    it('creates int from bigint', () => {
      expect(toIntCV(0n)).toEqual({ type: 'int', value: 0n });
    });
  });

  describe('toBoolCV', () => {
    it('wraps true', () => {
      expect(toBoolCV(true)).toEqual({ type: 'bool', value: true });
    });

    it('wraps false', () => {
      expect(toBoolCV(false)).toEqual({ type: 'bool', value: false });
    });
  });

  describe('toStringAsciiCV', () => {
    it('creates string-ascii', () => {
      expect(toStringAsciiCV('hello')).toEqual({ type: 'string-ascii', value: 'hello' });
    });

    it('throws for non-ASCII characters', () => {
      expect(() => toStringAsciiCV('héllo')).toThrow(/Non-ASCII character/);
    });

    it('accepts empty string', () => {
      expect(toStringAsciiCV('')).toEqual({ type: 'string-ascii', value: '' });
    });
  });

  describe('toStringUtf8CV', () => {
    it('creates string-utf8 with unicode', () => {
      expect(toStringUtf8CV('hello 🌐')).toEqual({ type: 'string-utf8', value: 'hello 🌐' });
    });
  });

  describe('toPrincipalCV', () => {
    it('creates standard principal from address', () => {
      const result = toPrincipalCV('SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD');
      expect(result.type).toBe('principal');
      expect(result.value.address).toBe('SP3BXJENEWVNCFYGJF75DFS478H1BZJXNZPT84EAD');
      expect(result.value.contractName).toBeUndefined();
    });

    it('creates contract principal from dotted address', () => {
      const result = toPrincipalCV('SP3BXJ.promo-manager');
      expect(result.value.address).toBe('SP3BXJ');
      expect(result.value.contractName).toBe('promo-manager');
    });
  });

  describe('toListCV', () => {
    it('wraps array of values', () => {
      const list = toListCV([toUIntCV(1), toUIntCV(2)]);
      expect(list.type).toBe('list');
      expect(list.value).toHaveLength(2);
    });
  });

  describe('optional helpers', () => {
    it('toSomeCV wraps a value', () => {
      const some = toSomeCV(toUIntCV(10));
      expect(some).toEqual({ type: 'optional', value: { type: 'uint', value: 10n } });
    });

    it('toNoneCV returns null optional', () => {
      expect(toNoneCV()).toEqual({ type: 'optional', value: null });
    });
  });

  describe('extraction helpers', () => {
    it('cvToNumber extracts safe integer', () => {
      expect(cvToNumber({ type: 'uint', value: 42n })).toBe(42);
    });

    it('cvToNumber throws for unsafe integer', () => {
      expect(() => cvToNumber({ type: 'uint', value: BigInt(Number.MAX_SAFE_INTEGER) + 1n })).toThrow('exceeds safe integer');
    });

    it('cvToBigInt extracts bigint', () => {
      expect(cvToBigInt({ type: 'uint', value: 999n })).toBe(999n);
    });

    it('cvToString extracts string value', () => {
      expect(cvToString({ type: 'string-ascii', value: 'test' })).toBe('test');
    });

    it('cvToAddress extracts standard address', () => {
      expect(cvToAddress({ type: 'principal', value: { address: 'SP123' } })).toBe('SP123');
    });

    it('cvToAddress extracts contract address', () => {
      expect(cvToAddress({ type: 'principal', value: { address: 'SP123', contractName: 'foo' } })).toBe('SP123.foo');
    });
  });

  describe('timestamp conversions', () => {
    it('stacksBlockTimeToDate converts seconds to Date', () => {
      const date = stacksBlockTimeToDate(1700000000);
      expect(date.getTime()).toBe(1700000000 * 1000);
    });

    it('dateToStacksBlockTime converts Date to seconds', () => {
      const date = new Date(1700000000000);
      expect(dateToStacksBlockTime(date)).toBe(1700000000);
    });

    it('round-trips correctly', () => {
      const original = 1700000000;
      expect(dateToStacksBlockTime(stacksBlockTimeToDate(original))).toBe(original);
    });
  });
});
