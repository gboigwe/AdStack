// Stacks Connect sign message request builders

export type SignMessageParams = { message: string; onFinish?: (data: SignatureData) => void; onCancel?: () => void };

export type SignatureData = { signature: string; publicKey: string };

export type StructuredDataDomain = { name: string; version: string; chainId: number };

export type SignStructuredDataParams = { message: unknown; domain: StructuredDataDomain; onFinish?: (data: SignatureData) => void; onCancel?: () => void };

export const MAINNET_CHAIN_ID = 1;

export const TESTNET_CHAIN_ID = 2147483648;

export function buildSignMessageRequest(message: string): SignMessageParams {
  return { message };
}

export function buildSignStructuredDataRequest(
  message: unknown,
  domain: StructuredDataDomain
): SignStructuredDataParams {
  return { message, domain };
}
