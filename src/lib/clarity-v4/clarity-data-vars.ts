// Clarity v4 Data Variable Patterns

export type DataVar<T> = { name: string; value: T; type: 'data-var' };

export type DataVarUpdate<T> = { varName: string; newValue: T };
