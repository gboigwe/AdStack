import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('feature-flags', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  async function importFlags() {
    return import('@/lib/feature-flags');
  }

  it('FF_GOVERNANCE defaults to true', async () => {
    delete process.env.NEXT_PUBLIC_FF_GOVERNANCE;
    const flags = await importFlags();
    expect(flags.FF_GOVERNANCE).toBe(true);
  });

  it('FF_ANALYTICS_CHARTS defaults to false', async () => {
    delete process.env.NEXT_PUBLIC_FF_ANALYTICS_CHARTS;
    const flags = await importFlags();
    expect(flags.FF_ANALYTICS_CHARTS).toBe(false);
  });

  it('reads "true" env var as true', async () => {
    process.env.NEXT_PUBLIC_FF_NOTIFICATIONS = 'true';
    const flags = await importFlags();
    expect(flags.FF_NOTIFICATIONS).toBe(true);
  });

  it('reads "1" env var as true', async () => {
    process.env.NEXT_PUBLIC_FF_NOTIFICATIONS = '1';
    const flags = await importFlags();
    expect(flags.FF_NOTIFICATIONS).toBe(true);
  });

  it('reads "false" env var as false', async () => {
    process.env.NEXT_PUBLIC_FF_GOVERNANCE = 'false';
    const flags = await importFlags();
    expect(flags.FF_GOVERNANCE).toBe(false);
  });

  it('reads arbitrary string as false', async () => {
    process.env.NEXT_PUBLIC_FF_GOVERNANCE = 'yes';
    const flags = await importFlags();
    expect(flags.FF_GOVERNANCE).toBe(false);
  });

  it('exports all expected flags', async () => {
    const flags = await importFlags();
    expect(flags).toHaveProperty('FF_GOVERNANCE');
    expect(flags).toHaveProperty('FF_PUBLISHER_MARKETPLACE');
    expect(flags).toHaveProperty('FF_ANALYTICS_CHARTS');
    expect(flags).toHaveProperty('FF_NOTIFICATIONS');
    expect(flags).toHaveProperty('FF_DARK_MODE_AUTO');
  });
});
