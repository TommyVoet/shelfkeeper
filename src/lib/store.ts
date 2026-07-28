/**
 * De hele collectie staat in het geheugen (zoeken moet direct zijn) en wordt
 * daarnaast in IndexedDB bewaard. Schermen luisteren via useStore().
 */
import { useEffect, useReducer } from 'preact/hooks';
import * as db from './db';
import { newId, prepareBook } from './book';
import type { Book, BookInput, Loan, Shelf, Tag } from './types';

export interface State {
  ready: boolean;
  books: Book[];
  shelves: Shelf[];
  tags: Tag[];
  loans: Loan[];
}

let state: State = { ready: false, books: [], shelves: [], tags: [], loans: [] };
const listeners = new Set<() => void>();

function set(patch: Partial<State>): void {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

export function getState(): State {
  return state;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useStore(): State {
  const [, force] = useReducer((c: number) => c + 1, 0);
  useEffect(() => subscribe(force), []);
  return state;
}

let loading: Promise<void> | null = null;

export function init(): Promise<void> {
  loading ??= (async () => {
    const [books, shelves, tags, loans] = await Promise.all([
      db.allBooks(),
      db.allShelves(),
      db.allTags(),
      db.allLoans(),
    ]);
    set({ ready: true, books, shelves, tags, loans });
  })();
  return loading;
}

/* ---------------- boeken ---------------- */

export async function saveBook(input: BookInput): Promise<Book> {
  const existing = input.id ? state.books.find((b) => b.id === input.id) : undefined;
  const book = prepareBook({ ...existing, ...input });
  await db.putBook(book);
  const books = existing
    ? state.books.map((b) => (b.id === book.id ? book : b))
    : [...state.books, book];
  set({ books });
  return book;
}

export async function saveBooks(inputs: BookInput[]): Promise<Book[]> {
  const prepared = inputs.map((i) => prepareBook(i));
  await db.putBooks(prepared);
  const byId = new Map(prepared.map((b) => [b.id, b]));
  const merged = state.books.map((b) => byId.get(b.id) ?? b);
  for (const b of prepared) if (!state.books.some((o) => o.id === b.id)) merged.push(b);
  set({ books: merged });
  return prepared;
}

export async function removeBook(id: string): Promise<void> {
  const book = state.books.find((b) => b.id === id);
  await db.deleteBook(id);
  if (book?.coverKey) {
    const stillUsed = state.books.some((b) => b.id !== id && b.coverKey === book.coverKey);
    if (!stillUsed) await db.deleteCover(book.coverKey);
  }
  set({
    books: state.books.filter((b) => b.id !== id),
    loans: state.loans.filter((l) => l.bookId !== id),
  });
}

/** Zoekt een boek op ISBN-13 in het geheugen (voor de dubbelcheck bij scannen). */
export function bookByIsbn(isbn13: string): Book | undefined {
  return state.books.find((b) => b.isbn13 === isbn13);
}

/* ---------------- planken ---------------- */

const SHELF_COLORS = ['#2f6b52', '#4a55b8', '#b4532f', '#7a3b78', '#1c6a72', '#c72a80'];

export async function createShelf(name: string, color?: string): Promise<Shelf> {
  const shelf: Shelf = {
    id: newId(),
    name: name.trim(),
    color: color ?? SHELF_COLORS[state.shelves.length % SHELF_COLORS.length],
    order: state.shelves.length,
    createdAt: Date.now(),
  };
  await db.putShelf(shelf);
  set({ shelves: [...state.shelves, shelf] });
  return shelf;
}

export async function updateShelf(shelf: Shelf): Promise<void> {
  await db.putShelf(shelf);
  set({ shelves: state.shelves.map((s) => (s.id === shelf.id ? shelf : s)) });
}

/** Verwijdert de plank en haalt hem overal weg; de boeken zelf blijven staan. */
export async function removeShelf(id: string): Promise<void> {
  const touched = state.books.filter((b) => b.shelfIds.includes(id));
  const updated = touched.map((b) => ({ ...b, shelfIds: b.shelfIds.filter((s) => s !== id) }));
  await db.deleteShelf(id);
  if (updated.length) await db.putBooks(updated);
  const byId = new Map(updated.map((b) => [b.id, b]));
  set({
    shelves: state.shelves.filter((s) => s.id !== id),
    books: state.books.map((b) => byId.get(b.id) ?? b),
  });
}

/* ---------------- etiketten ---------------- */

export async function createTag(name: string, color?: string): Promise<Tag> {
  const tag: Tag = {
    id: newId(),
    name: name.trim(),
    color: color ?? SHELF_COLORS[state.tags.length % SHELF_COLORS.length],
    createdAt: Date.now(),
  };
  await db.putTag(tag);
  set({ tags: [...state.tags, tag] });
  return tag;
}

export async function updateTag(tag: Tag): Promise<void> {
  await db.putTag(tag);
  set({ tags: state.tags.map((t) => (t.id === tag.id ? tag : t)) });
}

export async function removeTag(id: string): Promise<void> {
  const touched = state.books.filter((b) => b.tagIds.includes(id));
  const updated = touched.map((b) => ({ ...b, tagIds: b.tagIds.filter((t) => t !== id) }));
  await db.deleteTag(id);
  if (updated.length) await db.putBooks(updated);
  const byId = new Map(updated.map((b) => [b.id, b]));
  set({
    tags: state.tags.filter((t) => t.id !== id),
    books: state.books.map((b) => byId.get(b.id) ?? b),
  });
}

/* ---------------- uitleen ---------------- */

export async function lendBook(bookId: string, person: string, dueAt?: number): Promise<Loan> {
  const loan: Loan = { id: newId(), bookId, person: person.trim(), lentAt: Date.now(), dueAt };
  await db.putLoan(loan);
  set({ loans: [...state.loans, loan] });
  return loan;
}

export async function returnLoan(id: string): Promise<void> {
  const loan = state.loans.find((l) => l.id === id);
  if (!loan) return;
  const done = { ...loan, returnedAt: Date.now() };
  await db.putLoan(done);
  set({ loans: state.loans.map((l) => (l.id === id ? done : l)) });
}

export async function removeLoan(id: string): Promise<void> {
  await db.deleteLoan(id);
  set({ loans: state.loans.filter((l) => l.id !== id) });
}

/** De lopende uitlening van een boek, als die er is. */
export function openLoanFor(bookId: string): Loan | undefined {
  return state.loans.find((l) => l.bookId === bookId && !l.returnedAt);
}

export function openLoans(): Loan[] {
  return state.loans.filter((l) => !l.returnedAt).sort((a, b) => a.lentAt - b.lentAt);
}

/* ---------------- alles vervangen (import) ---------------- */

export async function replaceAll(data: {
  books: Book[];
  shelves: Shelf[];
  tags: Tag[];
  loans: Loan[];
}): Promise<void> {
  await db.clearAll();
  await Promise.all([
    db.putBooks(data.books),
    ...data.shelves.map(db.putShelf),
    ...data.tags.map(db.putTag),
    ...data.loans.map(db.putLoan),
  ]);
  set({ ...data, ready: true });
}
