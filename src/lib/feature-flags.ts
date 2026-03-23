/**
 * Feature Flags
 *
 * Simple compile-time feature flags based on environment variables.
 * These are statically replaced by Next.js at build time, so
 * dead branches get tree-shaken in production.
 *
 * To add a new flag:
 * 1. Add a NEXT_PUBLIC_FF_* env var
 * 2. Export a constant here
 * 3. Use it with a regular `if` check — the bundler will eliminate
 *    the dead branch when the flag is false.
 */

function envFlag(key: string, defaultValue = false): boolean {
  const raw = process.env[key];
  if (raw === undefined) return defaultValue;
  return raw === 'true' || raw === '1';
}

/** Enable the governance voting UI. */
export const FF_GOVERNANCE = envFlag('NEXT_PUBLIC_FF_GOVERNANCE', true);

/** Enable the publisher ad-slot marketplace. */
export const FF_PUBLISHER_MARKETPLACE = envFlag('NEXT_PUBLIC_FF_PUBLISHER_MARKETPLACE', true);

/** Show campaign analytics charts. */
export const FF_ANALYTICS_CHARTS = envFlag('NEXT_PUBLIC_FF_ANALYTICS_CHARTS', false);

/** Enable the notification center. */
export const FF_NOTIFICATIONS = envFlag('NEXT_PUBLIC_FF_NOTIFICATIONS', false);

/** Enable experimental dark mode auto-detection. */
export const FF_DARK_MODE_AUTO = envFlag('NEXT_PUBLIC_FF_DARK_MODE_AUTO', true);
