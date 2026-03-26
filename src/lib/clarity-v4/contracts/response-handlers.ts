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

export function tryUnwrap<T>(r: ContractResponse<T>): T {
  if (r.type !== 'ok') throw new Error(`Contract returned error: ${r.value}`);
  return r.value;
}

export function tryUnwrapOr<T>(r: ContractResponse<T>, fallback: T): T {
  return r.type === 'ok' ? r.value : fallback;
}

export function mapContractOk<T, U>(r: ContractResponse<T>, fn: (v: T) => U): ContractResponse<U> {
  if (r.type === 'ok') return contractOk(fn(r.value));
  return r;
}

export function flatMapContractOk<T, U>(
  r: ContractResponse<T>,
  fn: (v: T) => ContractResponse<U>
): ContractResponse<U> {
  if (r.type === 'ok') return fn(r.value);
  return r;
}
