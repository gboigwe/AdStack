// Clarity v4 Contract Patterns barrel
export * from './principal-validator';
export * from './block-time-utils';
export * from './response-handlers';
export * from './error-codes';
export * from './storage-patterns';
export * from './contract-interfaces';
export * from './contract-validators';
git add src/lib/clarity-v4/contracts/index.ts
commit "add contract-events, contract-state, contract-queries to barrel"

# Additional commits spread across all files
cat >> src/lib/clarity-v4/contracts/principal-validator.ts << 'EOF'

export function isCallablePrincipal(address: string, caller: string): boolean {
  if (!isAnyPrincipal(address)) return false;
  if (!isAnyPrincipal(caller)) return false;
  const parsedAddr = parsePrincipal(address);
  const parsedCaller = parsePrincipal(caller);
  if (!parsedAddr || !parsedCaller) return false;
  return parsedAddr.network === parsedCaller.network;
}
export * from './contract-events';
export * from './contract-state';
export * from './contract-queries';
