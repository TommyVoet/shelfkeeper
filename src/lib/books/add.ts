/**
 * Een gevonden boek toevoegen aan de eigen collectie, inclusief een offline
 * kopie van de omslag.
 */
import { putCover } from '../db';
import { dedupeKey } from '../book';
import { getState, saveBook } from '../store';
import type { Book, BookSource } from '../types';
import type { BookCandidate } from './openlibrary';

/** Bestaat dit boek al? Eerst op ISBN, anders op titel + eerste auteur. */
export function findExisting(candidate: Pick<BookCandidate, 'title' | 'authors' | 'isbn13'>): Book | undefined {
  const { books } = getState();
  if (candidate.isbn13) {
    const hit = books.find((b) => b.isbn13 === candidate.isbn13);
    if (hit) return hit;
  }
  const key = dedupeKey({ title: candidate.title, authors: candidate.authors });
  return books.find((b) => dedupeKey(b) === key);
}

/**
 * Haalt de omslag op en bewaart hem als bestand in de database.
 * Mislukt dat (geen bereik), dan blijft het adres bewaard en probeert de app
 * het later opnieuw — het boek zelf gaat er nooit door verloren.
 */
export async function cacheCover(coverId: number | undefined, url: string | undefined): Promise<string | undefined> {
  if (!url) return undefined;
  const key = coverId ? `ol-${coverId}` : `url-${url}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    if (!blob.size) return undefined;
    await putCover(key, blob);
    return key;
  } catch {
    return undefined;
  }
}

export interface AddOptions {
  source: BookSource;
  shelfIds?: string[];
  status?: Book['status'];
}

export async function addCandidate(
  candidate: BookCandidate,
  { source, shelfIds = [], status = 'owned' }: AddOptions,
): Promise<Book> {
  const book = await saveBook({
    title: candidate.title,
    subtitle: candidate.subtitle,
    authors: candidate.authors,
    year: candidate.year,
    pages: candidate.pages,
    publisher: candidate.publisher,
    isbn13: candidate.isbn13,
    language: candidate.language,
    olKey: candidate.olKey,
    coverUrl: candidate.coverUrl,
    shelfIds,
    status,
    source,
  });

  // De omslag komt er los achteraan; het boek staat al in de kast.
  const coverKey = await cacheCover(candidate.coverId, candidate.coverUrl);
  if (coverKey) return saveBook({ id: book.id, title: book.title, coverKey });
  return book;
}
