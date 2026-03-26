// Clarity v4 Contract Response Handler Patterns

export type ContractResponse<T = unknown> = { type: 'ok'; value: T } | { type: 'err'; value: bigint };

export type ContractOk<T> = { type: 'ok'; value: T };
export type ContractErr = { type: 'err'; value: bigint };
