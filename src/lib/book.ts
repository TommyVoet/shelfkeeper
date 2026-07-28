import type { Book, BookInput } from './types';
import { authorSortName, norm } from './text';
import { cleanIsbn, isValidIsbn10, isbn13to10, isbnKey } from './isbn';

/** Korte, sorteerbare, botsingsvrije sleutel. */
export function newId(): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return Date.now().toString(36) + rnd;
}

/** Auteurs als één regel: "Harry Mulisch & Cees Nooteboom". */
export function authorLine(authors: string[] | undefined): string {
  return (authors ?? []).filter(Boolean).join(' & ');
}

/**
 * Vult alle afgeleide velden en normaliseert de invoer.
 * Alles wat op meerdere plekken hetzelfde moet zijn (sorteersleutel,
 * zoektekst, ISBN-varianten) wordt hier één keer berekend.
 */
export function prepareBook(input: BookInput, now = Date.now()): Book {
  const authors = (input.authors ?? []).map((a) => a.trim()).filter(Boolean);
  const title = (input.title ?? '').trim();

  // isbnKey levert altijd de ISBN-13-vorm, ook uit een ISBN-10.
  const isbn13 = isbnKey(input.isbn13) ?? isbnKey(input.isbn10) ?? undefined;
  let isbn10 = cleanIsbn(input.isbn10) || undefined;
  if (isbn10 && !isValidIsbn10(isbn10)) isbn10 = undefined;
  if (!isbn10 && isbn13) isbn10 = isbn13to10(isbn13) ?? undefined;

  const authorSort = authors.length ? authorSortName(authors[0]) : '';
  const titleKey = norm(stripLeadingArticle(title));

  const hay = norm(
    [
      title,
      input.subtitle,
      input.originalTitle,
      input.series,
      ...authors,
      authorSort,
      input.publisher,
      input.notes,
      input.year ? String(input.year) : '',
      isbn13,
      isbn10,
    ]
      .filter(Boolean)
      .join(' '),
  );

  return {
    id: input.id ?? newId(),
    title,
    subtitle: input.subtitle?.trim() || undefined,
    authors,
    originalTitle: input.originalTitle?.trim() || undefined,
    series: input.series?.trim() || undefined,
    isbn13,
    isbn10,
    publisher: input.publisher?.trim() || undefined,
    year: input.year,
    pages: input.pages,
    language: input.language,
    olKey: input.olKey,
    coverUrl: input.coverUrl,
    coverKey: input.coverKey,
    shelfIds: input.shelfIds ?? [],
    tagIds: input.tagIds ?? [],
    status: input.status ?? 'owned',
    rating: input.rating ?? 0,
    notes: input.notes?.trim() || undefined,
    addedAt: input.addedAt ?? now,
    updatedAt: now,
    source: input.source ?? 'manual',

    authorSort,
    // Zonder auteur sorteren we op titel; anders klonteren ze allemaal bovenaan.
    sortKey: norm(authorSort) || titleKey,
    titleKey,
    hay,
  };
}

/**
 * "The Hobbit" sorteert onder H, "De ontdekking van de hemel" onder O.
 * Lidwoorden in de drie talen van de app plus Engels/Duits.
 */
const ARTICLES = /^(the|a|an|de|het|een|le|la|les|l'|un|une|der|die|das|il|lo|els?)\s+/i;

export function stripLeadingArticle(title: string): string {
  return (title ?? '').trim().replace(ARTICLES, '');
}

/**
 * Sleutel om dubbele boeken te herkennen als er geen ISBN is:
 * genormaliseerde titel + eerste auteur.
 */
export function dedupeKey(book: Pick<Book, 'title' | 'authors'>): string {
  return `${norm(stripLeadingArticle(book.title))}|${norm(book.authors[0] ?? '')}`;
}
