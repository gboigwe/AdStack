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
