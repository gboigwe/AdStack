// Clarity v4 Trait Reference Utilities

export type TraitReference = { type: 'trait'; contractId: string; traitName: string };

export type TraitMethod = { name: string; inputs: string[]; output: string };
