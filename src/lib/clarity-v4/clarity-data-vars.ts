// Clarity v4 Data Variable Patterns

export type DataVar<T> = { name: string; value: T; type: 'data-var' };

export type DataVarUpdate<T> = { varName: string; newValue: T };

export function makeDataVar<T>(name: string, initialValue: T): DataVar<T> {
  return { name, value: initialValue, type: 'data-var' };
}

export function getDataVar<T>(v: DataVar<T>): T {
  return v.value;
}

export function setDataVar<T>(v: DataVar<T>, newValue: T): DataVar<T> {
  return { ...v, value: newValue };
}

export function updateDataVar<T>(v: DataVar<T>, fn: (current: T) => T): DataVar<T> {
  return setDataVar(v, fn(v.value));
}

export function isDataVar<T>(val: unknown): val is DataVar<T> {
  return typeof val === 'object' && val !== null && (val as DataVar<T>).type === 'data-var';
}

export function resetDataVar<T>(v: DataVar<T>, defaultValue: T): DataVar<T> {
  return setDataVar(v, defaultValue);
}
