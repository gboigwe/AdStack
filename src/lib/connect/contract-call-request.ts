// Stacks Connect contract call request builders

export type Network = 'mainnet' | 'testnet' | 'devnet';

export type PostConditionMode = 'allow' | 'deny';

export type AnchorMode = 'any' | 'on_chain_only' | 'off_chain_only';

export type ContractCallRequestParams = { contractAddress: string; contractName: string; functionName: string; functionArgs: unknown[]; network: Network; postConditions?: unknown[]; postConditionMode?: PostConditionMode; anchorMode?: AnchorMode; fee?: bigint; nonce?: bigint; onFinish?: (data: TxBroadcastResult) => void; onCancel?: () => void };

export type TxBroadcastResult = { txId: string; txRaw: string };

export const DEFAULT_POST_CONDITION_MODE: PostConditionMode = 'deny';

export const DEFAULT_ANCHOR_MODE: AnchorMode = 'any';

export function buildContractCallRequest(
  contractId: string,
  functionName: string,
  functionArgs: unknown[],
  network: Network = 'mainnet'
): ContractCallRequestParams {
  const [contractAddress, contractName] = contractId.split('.');
  return {
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    network,
    postConditionMode: DEFAULT_POST_CONDITION_MODE,
    anchorMode: DEFAULT_ANCHOR_MODE,
  };
}
