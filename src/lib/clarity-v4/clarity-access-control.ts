// Clarity v4 Access Control Patterns

export type Principal = string;
export type ContractOwner = { address: Principal; isSet: boolean };

export type AccessRole = 'owner' | 'admin' | 'operator' | 'viewer';
