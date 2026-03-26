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
