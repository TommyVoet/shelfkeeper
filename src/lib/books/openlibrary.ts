/**
 * Open Library — gratis, geen sleutel nodig, werkt vanuit de browser (CORS).
 *
 * Open Library vraagt om zuinig gebruik: we bewaren elk antwoord in het
 * geheugen, wachten tot iemand klaar is met typen, en de service worker cachet
 * de aanroepen nog eens apart. (Een eigen User-Agent meesturen mag een browser
 * niet; daarom houden we het aantal aanroepen laag.)
 */
import { isbnKey } from '../isbn';

const SEARCH_URL = 'https://openlibrary.org/search.json';
const BOOKS_URL = 'https://openlibrary.org/api/books';
const COVER_URL = 'https://covers.openlibrary.org/b/id';

export interface BookCandidate {
  title: string;
  subtitle?: string;
  authors: string[];
  year?: number;
  pages?: number;
  publisher?: string;
  isbn13?: string;
  language?: string;
  olKey?: string;
  /** Nummer van de omslag bij Open Library; hiermee halen we hem later op. */
  coverId?: number;
  coverUrl?: string;
}

/** Antwoorden onthouden zolang de app open staat. */
const searchCache = new Map<string, BookCandidate[]>();
const isbnCache = new Map<string, BookCandidate | null>();

export function coverUrlFor(coverId: number, size: 'S' | 'M' | 'L' = 'M'): string {
  return `${COVER_URL}/${coverId}-${size}.jpg`;
}

interface SearchDoc {
  key?: string;
  title?: string;
  subtitle?: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  publisher?: string[];
  language?: string[];
  cover_i?: number;
}

const SEARCH_FIELDS =
  'key,title,subtitle,author_name,first_publish_year,number_of_pages_median,publisher,language,cover_i';

function fromDoc(doc: SearchDoc): BookCandidate {
  return {
    title: (doc.title ?? '').trim(),
    subtitle: doc.subtitle?.trim(),
    authors: doc.author_name ?? [],
    year: doc.first_publish_year,
    pages: doc.number_of_pages_median,
    publisher: doc.publisher?.[0],
    language: doc.language?.[0],
    olKey: doc.key,
    coverId: doc.cover_i,
    coverUrl: doc.cover_i ? coverUrlFor(doc.cover_i) : undefined,
    // Bewust géén ISBN: een zoekresultaat gaat over het werk, niet over de
    // uitgave die jij in handen hebt. Bij scannen weten we dat wél.
  };
}

export async function searchBooks(
  query: string,
  { signal, limit = 20 }: { signal?: AbortSignal; limit?: number } = {},
): Promise<BookCandidate[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const cached = searchCache.get(q);
  if (cached) return cached;

  const url = `${SEARCH_URL}?q=${encodeURIComponent(q)}&fields=${SEARCH_FIELDS}&limit=${limit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Open Library: HTTP ${res.status}`);
  const json = (await res.json()) as { docs?: SearchDoc[] };
  const out = (json.docs ?? []).map(fromDoc).filter((b) => b.title);
  searchCache.set(q, out);
  return out;
}

interface ApiBook {
  title?: string;
  subtitle?: string;
  authors?: { name?: string }[];
  publishers?: { name?: string }[];
  publish_date?: string;
  number_of_pages?: number;
  cover?: { small?: string; medium?: string; large?: string };
  identifiers?: { isbn_13?: string[]; isbn_10?: string[]; openlibrary?: string[] };
  key?: string;
}

/** Jaartal uit "November 1, 2010" of "2010". */
function yearFrom(date: string | undefined): number | undefined {
  const m = (date ?? '').match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  return m ? Number(m[1]) : undefined;
}

/** Nummer van de omslag uit een adres als …/b/id/14648050-M.jpg. */
function coverIdFrom(url: string | undefined): number | undefined {
  const m = (url ?? '').match(/\/b\/id\/(\d+)-/);
  return m ? Number(m[1]) : undefined;
}

/** Eén uitgave opzoeken op ISBN. null = niet gevonden bij Open Library. */
export async function lookupIsbn(
  rawIsbn: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<BookCandidate | null> {
  const isbn = isbnKey(rawIsbn);
  if (!isbn) return null;
  if (isbnCache.has(isbn)) return isbnCache.get(isbn) ?? null;

  const url = `${BOOKS_URL}?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Open Library: HTTP ${res.status}`);
  const json = (await res.json()) as Record<string, ApiBook>;
  const raw = json[`ISBN:${isbn}`];
  if (!raw) {
    isbnCache.set(isbn, null);
    return null;
  }

  const coverId = coverIdFrom(raw.cover?.medium ?? raw.cover?.large ?? raw.cover?.small);
  const candidate: BookCandidate = {
    title: (raw.title ?? '').trim(),
    subtitle: raw.subtitle?.trim(),
    authors: (raw.authors ?? []).map((a) => (a.name ?? '').trim()).filter(Boolean),
    year: yearFrom(raw.publish_date),
    pages: raw.number_of_pages,
    publisher: raw.publishers?.[0]?.name,
    isbn13: isbn,
    olKey: raw.key,
    coverId,
    coverUrl: coverId ? coverUrlFor(coverId) : (raw.cover?.medium ?? undefined),
  };
  isbnCache.set(isbn, candidate);
  return candidate;
}
