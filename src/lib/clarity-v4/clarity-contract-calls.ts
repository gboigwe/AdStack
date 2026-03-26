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

export function isValidContractId(id: string): boolean {
  return parseContractId(id) !== null;
}

export function makeContractCallParams(
  contractId: string,
  functionName: string,
  args: unknown[],
  network: 'mainnet' | 'testnet' = 'mainnet'
): ContractCallParams | null {
  const parsed = parseContractId(contractId);
  if (!parsed) return null;
  return {
    contractAddress: parsed.address,
    contractName: parsed.name,
    functionName,
    functionArgs: args,
    network,
  };
}

export function makeReadOnlyCallParams(
  contractId: string,
  functionName: string,
  args: unknown[],
  senderAddress: string
): ReadOnlyCallParams | null {
  const parsed = parseContractId(contractId);
  if (!parsed) return null;
  return {
    contractAddress: parsed.address,
    contractName: parsed.name,
    functionName,
    functionArgs: args,
    senderAddress,
  };
}

export function successResult<T>(result: T): ContractCallResult<T> {
  return { success: true, result };
}

export function errorResult<T>(message: string): ContractCallResult<T> {
  return { success: false, result: null, errorMessage: message };
}
