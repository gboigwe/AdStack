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

export function mapList<T, U>(list: ClarityList<T>, fn: (item: T) => U): ClarityList<U> {
  return makeList(list.items.map(fn));
}

export function filterList<T>(list: ClarityList<T>, predicate: (item: T) => boolean): ClarityList<T> {
  return makeList(list.items.filter(predicate));
}

export function concatLists<T>(a: ClarityList<T>, b: ClarityList<T>): ClarityList<T> {
  return makeList([...a.items, ...b.items]);
}

export function reverseList<T>(list: ClarityList<T>): ClarityList<T> {
  return makeList([...list.items].reverse());
}

export function findInList<T>(list: ClarityList<T>, predicate: (item: T) => boolean): T | null {
  return list.items.find(predicate) ?? null;
}

export function someInList<T>(list: ClarityList<T>, predicate: (item: T) => boolean): boolean {
  return list.items.some(predicate);
}

export function everyInList<T>(list: ClarityList<T>, predicate: (item: T) => boolean): boolean {
  return list.items.every(predicate);
}

export function takeList<T>(list: ClarityList<T>, n: number): ClarityList<T> {
  return makeList(list.items.slice(0, n));
}

export function dropList<T>(list: ClarityList<T>, n: number): ClarityList<T> {
  return makeList(list.items.slice(n));
}

export function zipLists<A, B>(a: ClarityList<A>, b: ClarityList<B>): ClarityList<[A, B]> {
  const len = Math.min(a.items.length, b.items.length);
  const pairs: [A, B][] = Array.from({ length: len }, (_, i) => [a.items[i], b.items[i]]);
  return makeList(pairs);
}

export function sortList<T>(list: ClarityList<T>, compareFn: (a: T, b: T) => number): ClarityList<T> {
  return makeList([...list.items].sort(compareFn));
}

export function listToArray<T>(list: ClarityList<T>): T[] {
  return [...list.items];
}

export function isClarityList<T>(v: unknown): v is ClarityList<T> {
  return typeof v === 'object' && v !== null && (v as ClarityList<T>).type === 'list';
}

export function headList<T>(list: ClarityList<T>): T | null {
  return list.items.length > 0 ? list.items[0] : null;
}

export function tailList<T>(list: ClarityList<T>): ClarityList<T> {
  return makeList(list.items.slice(1));
}
