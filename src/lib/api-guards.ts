/**
 * Runtime type guards for Stacks API responses.
 *
 * API responses are typed via `as T` casts in apiFetch, but the actual
 * data comes from an external service. These guards validate shape at
 * the boundary so callers can trust the types downstream without
 * resorting to optional chaining everywhere.
 */

import type { StxBalance, ApiTransaction, TransactionList } from './stacks-api';

/* ─── Primitives ─────────────────────────────────────────── */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function hasString(obj: Record<string, unknown>, key: string): boolean {
  return typeof obj[key] === 'string';
}

function hasNumber(obj: Record<string, unknown>, key: string): boolean {
  return typeof obj[key] === 'number';
}

/* ─── StxBalance ─────────────────────────────────────────── */

export function isStxBalance(v: unknown): v is StxBalance {
  if (!isRecord(v)) return false;
  return (
    hasString(v, 'balance') &&
    hasString(v, 'total_sent') &&
    hasString(v, 'total_received') &&
    hasString(v, 'locked') &&
    hasNumber(v, 'lock_height')
  );
}

/* ─── ApiTransaction ─────────────────────────────────────── */

export function isApiTransaction(v: unknown): v is ApiTransaction {
  if (!isRecord(v)) return false;
  return (
    hasString(v, 'tx_id') &&
    hasString(v, 'tx_type') &&
    hasString(v, 'tx_status') &&
    hasNumber(v, 'block_height') &&
    hasNumber(v, 'burn_block_time') &&
    hasString(v, 'sender_address')
  );
}

/* ─── TransactionList ────────────────────────────────────── */

export function isTransactionList(v: unknown): v is TransactionList {
  if (!isRecord(v)) return false;
  if (!hasNumber(v, 'total') || !hasNumber(v, 'limit') || !hasNumber(v, 'offset')) {
    return false;
  }
  if (!Array.isArray(v.results)) return false;
  // Validate first item if present (avoid scanning full array)
  if (v.results.length > 0 && !isApiTransaction(v.results[0])) {
    return false;
  }
  return true;
}

/* ─── Block info ─────────────────────────────────────────── */

export function isBlockInfo(v: unknown): v is { stacks_tip_height: number } {
  return isRecord(v) && hasNumber(v, 'stacks_tip_height');
}

/* ─── Read-only call result ──────────────────────────────── */

export function isReadOnlyResult(
  v: unknown,
): v is { okay: boolean; result: string } {
  if (!isRecord(v)) return false;
  return typeof v.okay === 'boolean' && hasString(v, 'result');
}

/* ─── Generic helper ─────────────────────────────────────── */

/**
 * Validate an API response with a type guard and return a typed
 * result. Returns undefined (with a console warning) if validation
 * fails, letting callers decide on fallback behavior.
 */
export function validateResponse<T>(
  data: unknown,
  guard: (v: unknown) => v is T,
  label: string,
): T | undefined {
  if (guard(data)) return data;
  console.warn(`[api-guards] Invalid ${label} response:`, data);
  return undefined;
}
