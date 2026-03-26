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
