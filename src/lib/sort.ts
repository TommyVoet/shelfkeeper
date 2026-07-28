import type { Book } from './types';

export type SortMode = 'author' | 'title' | 'added';

/** Vergelijkt met de regels van de gekozen taal (é naast e, niet achteraan). */
function comparator(locale: string) {
  const c = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
  return (a: string, b: string) => c.compare(a, b);
}

export function sortBooks(books: Book[], mode: SortMode, locale = 'en'): Book[] {
  const cmp = comparator(locale);
  const out = books.slice();
  if (mode === 'added') {
    out.sort((a, b) => b.addedAt - a.addedAt || cmp(a.titleKey, b.titleKey));
  } else if (mode === 'title') {
    out.sort((a, b) => cmp(a.titleKey, b.titleKey) || cmp(a.sortKey, b.sortKey));
  } else {
    out.sort((a, b) => cmp(a.sortKey, b.sortKey) || cmp(a.titleKey, b.titleKey));
  }
  return out;
}

/**
 * Beginletter voor de A–Z-balk. Volgt de sorteervolgorde, anders springt de
 * balk naar de verkeerde plek. Cijfers en tekens vallen samen onder '#'.
 */
export function firstLetterOf(book: Book, mode: SortMode): string {
  const s = mode === 'title' ? book.titleKey : book.sortKey;
  const c = (s || '').charAt(0).toUpperCase();
  return c >= 'A' && c <= 'Z' ? c : '#';
}

/** Alleen de letters die echt voorkomen, in volgorde; '#' achteraan. */
export function presentLetters(books: Book[], mode: SortMode): string[] {
  const seen = new Set<string>();
  for (const b of books) seen.add(firstLetterOf(b, mode));
  const letters = [...seen].filter((l) => l !== '#').sort();
  if (seen.has('#')) letters.push('#');
  return letters;
}
