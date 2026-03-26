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

export function isEmptyList<T>(list: ClarityList<T>): boolean {
  return list.items.length === 0;
}

export function getListItem<T>(list: ClarityList<T>, index: number): T | null {
  if (index < 0 || index >= list.items.length) return null;
  return list.items[index];
}

export function foldLeft<T, A>(list: ClarityList<T>, initial: A, fn: (acc: A, item: T) => A): A {
  return list.items.reduce(fn, initial);
}

export function foldRight<T, A>(list: ClarityList<T>, initial: A, fn: (item: T, acc: A) => A): A {
  return list.items.reduceRight((acc, item) => fn(item, acc), initial);
}
