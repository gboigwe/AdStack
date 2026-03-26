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

export function matchContractResponse<T, R>(
  r: ContractResponse<T>,
  onOk: (value: T) => R,
  onErr: (code: bigint) => R
): R {
  if (r.type === 'ok') return onOk(r.value);
  return onErr(r.value);
}

export function propagateContractErr<T, U>(r: ContractResponse<T>): ContractErr | null {
  if (r.type === 'err') return r;
  return null;
}

export function combineContractResponses<T>(
  responses: ContractResponse<T>[]
): ContractResponse<T[]> {
  const values: T[] = [];
  for (const r of responses) {
    if (r.type === 'err') return r;
    values.push(r.value);
  }
  return contractOk(values);
}

export async function fromAsyncContractCall<T>(
  fn: () => Promise<T>
): Promise<ContractResponse<T>> {
  try {
    return contractOk(await fn());
  } catch (e) {
    return contractErr(BigInt(500));
  }
}

export function retryContractResponse<T>(
  responses: ContractResponse<T>[],
  maxRetries: number
): ContractResponse<T> {
  for (let i = 0; i < Math.min(responses.length, maxRetries); i++) {
    if (responses[i].type === 'ok') return responses[i];
  }
  return responses[responses.length - 1] ?? contractErr(500n);
}

export function logContractResponse<T>(
  r: ContractResponse<T>,
  label: string
): ContractResponse<T> {
  if (r.type === 'ok') {
    console.debug(`[${label}] OK:`, r.value);
  } else {
    console.warn(`[${label}] ERR:`, r.value);
  }
  return r;
}
