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
