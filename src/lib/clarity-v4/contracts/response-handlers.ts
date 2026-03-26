// Clarity v4 Contract Response Handler Patterns

export type ContractResponse<T = unknown> = { type: 'ok'; value: T } | { type: 'err'; value: bigint };

export type ContractOk<T> = { type: 'ok'; value: T };
export type ContractErr = { type: 'err'; value: bigint };

export function contractOk<T>(value: T): ContractOk<T> {
  return { type: 'ok', value };
}

export function contractErr(code: bigint): ContractErr {
  return { type: 'err', value: code };
}

export function isContractOk<T>(r: ContractResponse<T>): r is ContractOk<T> {
  return r.type === 'ok';
}

export function isContractErr<T>(r: ContractResponse<T>): r is ContractErr {
  return r.type === 'err';
}
