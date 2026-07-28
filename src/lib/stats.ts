import type { Book } from './types';
import { authorLine, dedupeKey } from './book';

export interface Duplicate {
  title: string;
  author: string;
  count: number;
  ids: string[];
}

export interface Stats {
  total: number;
  owned: number;
  read: number;
  reading: number;
  wishlist: number;
  authors: number;
  pages: number;
  /** Meest voorkomende auteurs, hoogste eerst. */
  topAuthors: { name: string; count: number }[];
  /** Boeken die twee keer in de kast lijken te staan. */
  duplicates: Duplicate[];
}

/** Groepeersleutel: ISBN als die er is, anders titel + eerste auteur. */
function groupKey(b: Book): string {
  return b.isbn13 ?? dedupeKey(b);
}

export function computeStats(books: Book[], topCount = 5): Stats {
  const authorCount = new Map<string, number>();
  const groups = new Map<string, Book[]>();
  let pages = 0;
  let owned = 0;
  let read = 0;
  let reading = 0;
  let wishlist = 0;

  for (const b of books) {
    for (const a of b.authors) authorCount.set(a, (authorCount.get(a) ?? 0) + 1);
    if (b.pages && b.pages > 0) pages += b.pages;
    if (b.status === 'owned') owned++;
    else if (b.status === 'read') read++;
    else if (b.status === 'reading') reading++;
    else if (b.status === 'wishlist') wishlist++;

    const k = groupKey(b);
    const list = groups.get(k);
    if (list) list.push(b);
    else groups.set(k, [b]);
  }

  const topAuthors = [...authorCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((x, y) => y.count - x.count || x.name.localeCompare(y.name))
    .slice(0, topCount);

  const duplicates: Duplicate[] = [];
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    duplicates.push({
      title: list[0].title,
      author: authorLine(list[0].authors),
      count: list.length,
      ids: list.map((b) => b.id),
    });
  }
  duplicates.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));

  return {
    total: books.length,
    owned,
    read,
    reading,
    wishlist,
    authors: authorCount.size,
    pages,
    topAuthors,
    duplicates,
  };
}
