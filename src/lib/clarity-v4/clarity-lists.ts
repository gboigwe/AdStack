// Clarity v4 List Utilities

export type ClarityList<T> = { type: 'list'; items: T[] };

export const MAX_LIST_LENGTH = 2000;

export function emptyList<T>(): ClarityList<T> {
  return { type: 'list', items: [] };
}

export function makeList<T>(items: T[]): ClarityList<T> {
  if (items.length > MAX_LIST_LENGTH) throw new RangeError(`List too long: ${items.length}`);
  return { type: 'list', items: [...items] };
}

export function appendToList<T>(list: ClarityList<T>, item: T): ClarityList<T> {
  if (list.items.length >= MAX_LIST_LENGTH) throw new RangeError('List is at max length');
  return makeList([...list.items, item]);
}

export function listLength<T>(list: ClarityList<T>): number {
  return list.items.length;
}
