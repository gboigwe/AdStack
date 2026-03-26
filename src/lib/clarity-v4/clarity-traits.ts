// Clarity v4 Trait Reference Utilities

export type TraitReference = { type: 'trait'; contractId: string; traitName: string };

export type TraitMethod = { name: string; inputs: string[]; output: string };

export type TraitDefinition = { name: string; methods: TraitMethod[] };

export function makeTraitRef(contractId: string, traitName: string): TraitReference {
  return { type: 'trait', contractId, traitName };
}

export function traitRefToString(ref: TraitReference): string {
  return `${ref.contractId}.${ref.traitName}`;
}

export function isTraitReference(v: unknown): v is TraitReference {
  return typeof v === 'object' && v !== null && (v as TraitReference).type === 'trait';
}

export function traitMethodMatches(impl: TraitMethod, required: TraitMethod): boolean {
  if (impl.name !== required.name) return false;
  if (impl.inputs.length !== required.inputs.length) return false;
  if (impl.output !== required.output) return false;
  return true;
}

export function contractImplementsTrait(methods: TraitMethod[], trait: TraitDefinition): boolean {
  return trait.methods.every(required =>
    methods.some(impl => traitMethodMatches(impl, required))
  );
}
