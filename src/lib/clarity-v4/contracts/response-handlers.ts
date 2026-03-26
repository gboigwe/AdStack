// Clarity v4 Contract Response Handler Patterns

export type ContractResponse<T = unknown> = { type: 'ok'; value: T } | { type: 'err'; value: bigint };
