/**
 * CSV lezen en kolommen herkennen.
 * De lezer komt uit Boekenzoeker: hij houdt rekening met aanhalingstekens,
 * dubbele aanhalingstekens in een veld en regeleindes binnen een veld.
 */
import { norm } from '../text';
import type { BookInput } from '../types';

/** Splitst CSV-tekst in rijen; lege rijen vallen weg. */
export function parseCSV(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v && v.trim() !== ''));
}

/** Puntkomma of tab in plaats van komma? Kies wat het vaakst voorkomt op de eerste regel. */
export function guessDelimiter(text: string): string {
  const firstLine = text.slice(0, text.indexOf('\n') + 1 || text.length);
  const counts = [',', ';', '\t'].map((d) => [d, firstLine.split(d).length - 1] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
}

export interface ColumnMap {
  last: number;
  first: number;
  author: number;
  title: number;
  originalTitle: number;
  notes: number;
  isbn: number;
  year: number;
  publisher: number;
  pages: number;
  series: number;
}

const EMPTY: ColumnMap = {
  last: -1, first: -1, author: -1, title: -1, originalTitle: -1,
  notes: -1, isbn: -1, year: -1, publisher: -1, pages: -1, series: -1,
};

/**
 * Herkent kolommen aan de koptekst, in het Nederlands, Engels of Frans.
 * Volgorde is belangrijk: "oorspronkelijke titel" moet vóór "titel" getoetst
 * worden, anders vangt "titel" hem weg.
 */
export function mapColumns(header: string[]): ColumnMap {
  const map: ColumnMap = { ...EMPTY };
  header.forEach((raw, i) => {
    const h = norm(raw);
    const set = (key: keyof ColumnMap) => {
      if (map[key] < 0) map[key] = i;
    };
    if (h.includes('achternaam') || h.includes('last name') || h.includes('surname') || h.includes('nom de famille')) set('last');
    else if (h.includes('voornaam') || h.includes('first name') || h.includes('prenom')) set('first');
    else if (h.includes('auteur') || h.includes('author') || h.includes('schrijver')) set('author');
    else if (h.includes('oorspronkelijk') || h.includes('origin')) set('originalTitle');
    else if (h.includes('titel') || h.includes('title') || h.includes('titre')) set('title');
    else if (h.includes('isbn') || h.includes('ean')) set('isbn');
    else if (h.includes('jaar') || h.includes('year') || h.includes('annee') || h.includes('publicatie')) set('year');
    else if (h.includes('uitgever') || h.includes('publisher') || h.includes('editeur')) set('publisher');
    else if (h.includes('pagina') || h.includes('page')) set('pages');
    else if (h.includes('reeks') || h.includes('series') || h.includes('serie')) set('series');
    else if (h.includes('opmerking') || h.includes('notitie') || h.includes('note') || h.includes('comment')) set('notes');
  });
  return map;
}

function hasAnyColumn(map: ColumnMap): boolean {
  return map.title >= 0 || map.last >= 0 || map.author >= 0;
}

const num = (v: string | undefined): number | undefined => {
  const m = (v ?? '').match(/\d{1,5}/);
  return m ? Number(m[0]) : undefined;
};

export interface ImportResult {
  books: BookInput[];
  /** Aantal rijen dat overgeslagen is omdat er geen titel én geen auteur in stond. */
  skipped: number;
  /** Of de eerste rij als koptekst gelezen is. */
  usedHeader: boolean;
}

/**
 * Zet ruwe CSV-tekst om naar boeken.
 * Zonder herkenbare koptekst gaan we uit van de volgorde van Boekenzoeker:
 * achternaam, voornaam, titel, oorspronkelijke titel, opmerkingen.
 */
export function booksFromCSV(text: string): ImportResult {
  const rows = parseCSV(text, guessDelimiter(text));
  if (!rows.length) return { books: [], skipped: 0, usedHeader: false };

  let map = mapColumns(rows[0]);
  const usedHeader = hasAnyColumn(map);
  let dataRows = rows;
  if (usedHeader) {
    dataRows = rows.slice(1);
  } else {
    map = { ...EMPTY, last: 0, first: 1, title: 2, originalTitle: 3, notes: 4 };
  }

  const pick = (r: string[], i: number) => (i >= 0 && r[i] ? r[i].trim() : '');
  const books: BookInput[] = [];
  let skipped = 0;

  for (const r of dataRows) {
    const last = pick(r, map.last);
    const first = pick(r, map.first);
    const whole = pick(r, map.author);
    const title = pick(r, map.title);
    const authors = whole
      ? whole.split(/\s*[&;]\s*/).map((a) => a.trim()).filter(Boolean)
      : [[first, last].filter(Boolean).join(' ')].filter(Boolean);

    if (!title && !authors.length) {
      skipped++;
      continue;
    }
    books.push({
      title: title || authors[0],
      authors: title ? authors : [],
      originalTitle: pick(r, map.originalTitle) || undefined,
      notes: pick(r, map.notes) || undefined,
      isbn13: pick(r, map.isbn) || undefined,
      year: num(pick(r, map.year)),
      pages: num(pick(r, map.pages)),
      publisher: pick(r, map.publisher) || undefined,
      series: pick(r, map.series) || undefined,
      source: 'import',
    });
  }
  return { books, skipped, usedHeader };
}
