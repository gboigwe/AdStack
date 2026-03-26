// Clarity v4 Access Control Patterns

export type Principal = string;
export type ContractOwner = { address: Principal; isSet: boolean };

export type AccessRole = 'owner' | 'admin' | 'operator' | 'viewer';

export type RoleAssignment = { principal: Principal; role: AccessRole };

export type AccessControlList = { assignments: RoleAssignment[] };

export function makeAccessControlList(): AccessControlList {
  return { assignments: [] };
}
