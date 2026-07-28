import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Book, Loan, Shelf, Tag } from './types';

export const DB_NAME = 'shelfkeeper';
export const DB_VERSION = 1;

interface SkDB extends DBSchema {
  books: {
    key: string;
    value: Book;
    indexes: {
      'by-isbn13': string;
      'by-sortKey': string;
      'by-added': number;
      'by-status': string;
    };
  };
  shelves: { key: string; value: Shelf; indexes: { 'by-order': number } };
  tags: { key: string; value: Tag };
  loans: { key: string; value: Loan; indexes: { 'by-book': string } };
  /** Omslagen als Blob, zodat ze ook zonder internet te zien zijn. */
  covers: { key: string; value: Blob };
  /** Losse waarden (schemaversie, tijdstip laatste back-up, …). */
  meta: { key: string; value: unknown };
}

let dbPromise: Promise<IDBPDatabase<SkDB>> | null = null;

export function db(): Promise<IDBPDatabase<SkDB>> {
  dbPromise ??= openDB<SkDB>(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion) {
      // Elke stap is los, zodat een latere versie er gewoon onder kan.
      if (oldVersion < 1) {
        const books = database.createObjectStore('books', { keyPath: 'id' });
        books.createIndex('by-isbn13', 'isbn13');
        books.createIndex('by-sortKey', 'sortKey');
        books.createIndex('by-added', 'addedAt');
        books.createIndex('by-status', 'status');

        const shelves = database.createObjectStore('shelves', { keyPath: 'id' });
        shelves.createIndex('by-order', 'order');

        database.createObjectStore('tags', { keyPath: 'id' });

        const loans = database.createObjectStore('loans', { keyPath: 'id' });
        loans.createIndex('by-book', 'bookId');

        database.createObjectStore('covers');
        database.createObjectStore('meta');
      }
    },
    blocked() {
      console.warn('[db] een ander tabblad houdt een oude versie open');
    },
  });
  return dbPromise;
}

/** Alleen voor tests: dwingt een nieuwe verbinding af. */
export function resetDbHandle(): void {
  dbPromise = null;
}

/* ---------------- boeken ---------------- */

export async function allBooks(): Promise<Book[]> {
  return (await db()).getAll('books');
}

export async function getBook(id: string): Promise<Book | undefined> {
  return (await db()).get('books', id);
}

export async function putBook(book: Book): Promise<void> {
  await (await db()).put('books', book);
}

export async function putBooks(books: Book[]): Promise<void> {
  const tx = (await db()).transaction('books', 'readwrite');
  await Promise.all([...books.map((b) => tx.store.put(b)), tx.done]);
}

export async function deleteBook(id: string): Promise<void> {
  const database = await db();
  const tx = database.transaction(['books', 'loans'], 'readwrite');
  const loanIds = await tx.objectStore('loans').index('by-book').getAllKeys(id);
  await Promise.all([
    tx.objectStore('books').delete(id),
    ...loanIds.map((k) => tx.objectStore('loans').delete(k)),
    tx.done,
  ]);
}

export async function findBookByIsbn(isbn13: string): Promise<Book | undefined> {
  return (await db()).getFromIndex('books', 'by-isbn13', isbn13);
}

/* ---------------- planken, etiketten, uitleen ---------------- */

export async function allShelves(): Promise<Shelf[]> {
  return (await db()).getAllFromIndex('shelves', 'by-order');
}
export async function putShelf(shelf: Shelf): Promise<void> {
  await (await db()).put('shelves', shelf);
}
export async function deleteShelf(id: string): Promise<void> {
  await (await db()).delete('shelves', id);
}

export async function allTags(): Promise<Tag[]> {
  return (await db()).getAll('tags');
}
export async function putTag(tag: Tag): Promise<void> {
  await (await db()).put('tags', tag);
}
export async function deleteTag(id: string): Promise<void> {
  await (await db()).delete('tags', id);
}

export async function allLoans(): Promise<Loan[]> {
  return (await db()).getAll('loans');
}
export async function putLoan(loan: Loan): Promise<void> {
  await (await db()).put('loans', loan);
}
export async function deleteLoan(id: string): Promise<void> {
  await (await db()).delete('loans', id);
}

/* ---------------- omslagen ---------------- */

export async function putCover(key: string, blob: Blob): Promise<void> {
  await (await db()).put('covers', blob, key);
}
export async function getCover(key: string): Promise<Blob | undefined> {
  return (await db()).get('covers', key);
}
export async function deleteCover(key: string): Promise<void> {
  await (await db()).delete('covers', key);
}
/** Omslagen zonder boek opruimen (na verwijderen of importeren). */
export async function pruneCovers(keepKeys: Set<string>): Promise<number> {
  const database = await db();
  const keys = await database.getAllKeys('covers');
  const dead = keys.filter((k) => !keepKeys.has(k as string));
  if (!dead.length) return 0;
  const tx = database.transaction('covers', 'readwrite');
  await Promise.all([...dead.map((k) => tx.store.delete(k)), tx.done]);
  return dead.length;
}

/* ---------------- meta ---------------- */

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db()).get('meta', key) as Promise<T | undefined>;
}
export async function setMeta(key: string, value: unknown): Promise<void> {
  await (await db()).put('meta', value, key);
}

/** Alles wissen (gebruikt door "importeren en vervangen"). */
export async function clearAll(): Promise<void> {
  const database = await db();
  const stores = ['books', 'shelves', 'tags', 'loans', 'covers'] as const;
  const tx = database.transaction(stores, 'readwrite');
  await Promise.all([...stores.map((s) => tx.objectStore(s).clear()), tx.done]);
}
