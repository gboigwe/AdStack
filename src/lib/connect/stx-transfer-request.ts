// Stacks Connect STX transfer request builders

export type StxTransferParams = { recipient: string; amount: bigint; memo?: string; network: 'mainnet' | 'testnet'; fee?: bigint; nonce?: bigint; onFinish?: (data: unknown) => void; onCancel?: () => void };
