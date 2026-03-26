// Stacks.js ClarityValue human-readable printer
import type { ClarityValue } from './clarity-value-factory';

export function cvToString(cv: ClarityValue): string {
  switch (cv.type) {
    case 'uint': return `u${(cv as { type: 'uint'; value: bigint }).value}`;
    case 'int': return `${(cv as { type: 'int'; value: bigint }).value}`;
    case 'bool': return `${(cv as { type: 'bool'; value: boolean }).value}`;
    case 'none': return 'none';
    case 'some': return `(some ${cvToString((cv as { type: 'some'; value: ClarityValue }).value)})`;
    case 'buffer': return `0x${Array.from((cv as { type: 'buffer'; buffer: Uint8Array }).buffer).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    case 'string-ascii': return `"${(cv as { type: 'string-ascii'; data: string }).data}"`;
    case 'string-utf8': return `u"${(cv as { type: 'string-utf8'; data: string }).data}"`;
    case 'standard_principal': return `'${(cv as { type: 'standard_principal'; address: string }).address}`;
    case 'contract_principal': {
      const p = cv as { type: 'contract_principal'; address: string; contractName: string };
      return `'${p.address}.${p.contractName}`;
    }
    case 'ok': return `(ok ${cvToString((cv as { type: 'ok'; value: ClarityValue }).value)})`;
    case 'error': return `(err ${cvToString((cv as { type: 'error'; value: ClarityValue }).value)})`;
    case 'list': return `(list ${(cv as { type: 'list'; list: ClarityValue[] }).list.map(cvToString).join(' ')})`;
    case 'tuple': {
      const entries = Object.entries((cv as { type: 'tuple'; data: Record<string, ClarityValue> }).data)
        .map(([k, v]) => `${k}: ${cvToString(v)}`).join(', ');
      return `(tuple ${entries})`;
    }
    default: return JSON.stringify(cv);
  }
}

export function cvToPrettyString(cv: ClarityValue, indent = 0): string {
  const pad = ' '.repeat(indent * 2);
  switch (cv.type) {
    case 'tuple': {
      const entries = Object.entries((cv as { type: 'tuple'; data: Record<string, ClarityValue> }).data)
        .map(([k, v]) => `${pad}  ${k}: ${cvToPrettyString(v, indent + 1)}`).join(',\n');
      return `{\n${entries}\n${pad}}`;
    }
    case 'list': {
      const items = (cv as { type: 'list'; list: ClarityValue[] }).list
        .map(item => `${pad}  ${cvToPrettyString(item, indent + 1)}`).join(',\n');
      return `[\n${items}\n${pad}]`;
    }
    default: return cvToString(cv);
  }
}

export function cvTypeDescription(cv: ClarityValue): string {
  switch (cv.type) {
    case 'uint': return 'uint128';
    case 'int': return 'int128';
    case 'bool': return 'bool';
    case 'none': return 'none';
    case 'some': return '(optional ?)';
    case 'buffer': return `(buff ${(cv as { type: 'buffer'; buffer: Uint8Array }).buffer.length})`;
    case 'string-ascii': return `(string-ascii ${(cv as { type: 'string-ascii'; data: string }).data.length})`;
    case 'string-utf8': return `(string-utf8 ${(cv as { type: 'string-utf8'; data: string }).data.length})`;
    case 'standard_principal': return 'principal';
    case 'contract_principal': return 'principal';
    case 'ok': return '(response ? ?)';
    case 'error': return '(response ? ?)';
    case 'list': return '(list ?)';
    case 'tuple': return '(tuple ...)';
    default: return 'unknown';
  }
}
