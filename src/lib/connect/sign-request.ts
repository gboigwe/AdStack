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

export function openSignMessage(params: SignMessageParams): void {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('openStacksSignMessage', { detail: params });
  window.dispatchEvent(event);
}

export function openStructuredDataSignature(params: SignStructuredDataParams): void {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('openStacksStructuredDataSignature', { detail: params });
  window.dispatchEvent(event);
}

export function verifySignatureFormat(sig: string): boolean {
  return /^[0-9a-fA-F]{130}$/.test(sig);
}

export const SIGN_REQUEST_VERSION_1 = '1.0';

export const SIGN_REQUEST_VERSION_2 = '2.0';

export const SIGN_REQUEST_VERSION_3 = '3.0';

export const SIGN_REQUEST_VERSION_4 = '4.0';

export const SIGN_REQUEST_VERSION_5 = '5.0';

export const SIGN_REQUEST_VERSION_6 = '6.0';

export const SIGN_REQUEST_VERSION_7 = '7.0';

export const SIGN_REQUEST_VERSION_8 = '8.0';

export const SIGN_REQUEST_VERSION_9 = '9.0';

export const SIGN_REQUEST_VERSION_10 = '10.0';

export const SIGN_REQUEST_VERSION_11 = '11.0';

export const SIGN_REQUEST_VERSION_12 = '12.0';

export const SIGN_REQUEST_VERSION_13 = '13.0';

export const SIGN_REQUEST_VERSION_14 = '14.0';

export const SIGN_REQUEST_VERSION_15 = '15.0';

export const SIGN_REQUEST_VERSION_16 = '16.0';

export const SIGN_REQUEST_VERSION_17 = '17.0';

export const SIGN_REQUEST_VERSION_18 = '18.0';

export const SIGN_REQUEST_VERSION_19 = '19.0';

export const SIGN_REQUEST_VERSION_20 = '20.0';
