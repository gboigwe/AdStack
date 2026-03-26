// Clarity v4 Access Control Patterns

export type Principal = string;
export type ContractOwner = { address: Principal; isSet: boolean };

export type AccessRole = 'owner' | 'admin' | 'operator' | 'viewer';

export type RoleAssignment = { principal: Principal; role: AccessRole };

export type AccessControlList = { assignments: RoleAssignment[] };

export function makeAccessControlList(): AccessControlList {
  return { assignments: [] };
}

export function grantRole(acl: AccessControlList, principal: Principal, role: AccessRole): AccessControlList {
  const filtered = acl.assignments.filter(a => !(a.principal === principal && a.role === role));
  return { assignments: [...filtered, { principal, role }] };
}
