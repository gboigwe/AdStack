// Stacks Connect sign message request builders

export type SignMessageParams = { message: string; onFinish?: (data: SignatureData) => void; onCancel?: () => void };

export type SignatureData = { signature: string; publicKey: string };
