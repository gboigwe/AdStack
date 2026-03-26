// Clarity v4 Contract Call Parameter Builders

export type ContractCallParams = {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: unknown[];
  network: 'mainnet' | 'testnet';
};

export type ReadOnlyCallParams = Omit<ContractCallParams, 'network'> & {
  senderAddress: string;
};

export type ContractCallResult<T> = {
  success: boolean;
  result: T | null;
  errorMessage?: string;
};

export function buildContractId(address: string, name: string): string {
  return `${address}.${name}`;
}

export function parseContractId(contractId: string): { address: string; name: string } | null {
  const parts = contractId.split('.');
  if (parts.length !== 2) return null;
  return { address: parts[0], name: parts[1] };
}
