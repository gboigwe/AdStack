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
