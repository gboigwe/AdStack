// Tests for API client type utilities
import { describe, it, expect } from 'vitest';
import { apiOk, apiErr } from '../types/api-response-types';

describe('apiOk', () => {
  it('creates ok result with data', () => {
    const r = apiOk({ foo: 'bar' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toEqual({ foo: 'bar' });
  });
});

describe('apiErr', () => {
  it('creates error result', () => {
    const r = apiErr({ error: 'not_found', message: 'Resource not found', code: 404 });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe(404);
      expect(r.error.error).toBe('not_found');
    }
  });
});
