// Stacks Connect STX transfer request builders

export type StxTransferParams = { recipient: string; amount: bigint; memo?: string; network: 'mainnet' | 'testnet'; fee?: bigint; nonce?: bigint; onFinish?: (data: unknown) => void; onCancel?: () => void };

export const MIN_STX_TRANSFER_AMOUNT = BigInt(1);

export const MAX_MEMO_LENGTH = 34;

export function buildStxTransferRequest(
  recipient: string,
  amount: bigint,
  memo?: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): StxTransferParams {
  return { recipient, amount, memo, network };
}

export function validateStxTransferParams(params: StxTransferParams): string | null {
  if (params.amount < MIN_STX_TRANSFER_AMOUNT) return 'Amount too small';
  if (params.memo && params.memo.length > MAX_MEMO_LENGTH) return 'Memo too long';
  if (!params.recipient) return 'Recipient required';
  return null;
}
