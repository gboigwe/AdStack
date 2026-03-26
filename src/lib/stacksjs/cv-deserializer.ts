// Stacks.js ClarityValue deserialization from API responses

export type DeserializedCV = {
  type: string;
  value?: unknown;
  repr?: string;
};

export type HiroApiCV = {
  type: string;
  value?: unknown;
  repr?: string;
  hex?: string;
};

export function parseUintFromRepr(repr: string): bigint {
  const match = repr.match(/^u(\d+)$/);
  if (!match) throw new Error(`Invalid uint repr: ${repr}`);
  return BigInt(match[1]);
}

export function parseIntFromRepr(repr: string): bigint {
  const match = repr.match(/^(-?\d+)$/);
  if (!match) throw new Error(`Invalid int repr: ${repr}`);
  return BigInt(match[1]);
}

export function parseBoolFromRepr(repr: string): boolean {
  if (repr === 'true') return true;
  if (repr === 'false') return false;
  throw new Error(`Invalid bool repr: ${repr}`);
}

export function parsePrincipalFromRepr(repr: string): string {
  if (repr.startsWith("'")) return repr.slice(1);
  return repr;
}

export function parseStringFromRepr(repr: string): string {
  const match = repr.match(/^"(.*)"$/);
  if (!match) return repr;
  return match[1];
}

export function parseOptionalFromRepr(repr: string): string | null {
  if (repr === 'none') return null;
  const match = repr.match(/^\(some (.*)\)$/);
  if (!match) return null;
  return match[1];
}

export function parseResponseFromRepr(repr: string): { ok: boolean; inner: string } {
  const okMatch = repr.match(/^\(ok (.*)\)$/);
  if (okMatch) return { ok: true, inner: okMatch[1] };
  const errMatch = repr.match(/^\(err (.*)\)$/);
  if (errMatch) return { ok: false, inner: errMatch[1] };
  throw new Error(`Invalid response repr: ${repr}`);
}
