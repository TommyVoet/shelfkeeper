/**
 * Back-up als één bestand. Alles wat je zelf hebt ingevuld gaat mee:
 * boeken, planken, etiketten en uitleningen. Omslagen niet — die haalt de app
 * zo weer op, en ze zouden het bestand tientallen megabytes groot maken.
 */
import { getState, replaceAll, saveBooks } from './store';
import { prepareBook, dedupeKey } from './book';
import type { Book, BookInput, Loan, Shelf, Tag } from './types';

export const BACKUP_FORMAT = 1;

export interface Backup {
  format: number;
  app: 'shelfkeeper';
  exportedAt: string;
  books: Book[];
  shelves: Shelf[];
  tags: Tag[];
  loans: Loan[];
}

export function buildBackup(now = new Date()): Backup {
  const { books, shelves, tags, loans } = getState();
  return {
    format: BACKUP_FORMAT,
    app: 'shelfkeeper',
    exportedAt: now.toISOString(),
    books,
    shelves,
    tags,
    loans,
  };
}

/** yyyy-mm-dd in het bestandsnaampje, zodat back-ups op volgorde staan. */
export function backupFileName(now = new Date()): string {
  return `shelfkeeper-${now.toISOString().slice(0, 10)}.json`;
}

export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(buildBackup(), null, 1)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName();
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export class BackupError extends Error {}

export function parseBackup(text: string): Backup {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupError('geen geldig back-upbestand');
  }
  const b = data as Partial<Backup>;
  if (!b || b.app !== 'shelfkeeper' || !Array.isArray(b.books)) {
    throw new BackupError('geen geldig back-upbestand');
  }
  if ((b.format ?? 0) > BACKUP_FORMAT) {
    throw new BackupError('dit bestand komt van een nieuwere versie van de app');
  }
  return {
    format: b.format ?? BACKUP_FORMAT,
    app: 'shelfkeeper',
    exportedAt: b.exportedAt ?? '',
    books: b.books,
    shelves: b.shelves ?? [],
    tags: b.tags ?? [],
    loans: b.loans ?? [],
  };
}

/** Alles vervangen door wat er in het bestand staat. */
export async function restoreBackup(backup: Backup): Promise<void> {
  await replaceAll({
    // Opnieuw afleiden: zo klopt de zoektekst ook als het bestand oud is.
    books: backup.books.map((b) => prepareBook(b, b.updatedAt || Date.now())),
    shelves: backup.shelves,
    tags: backup.tags,
    loans: backup.loans,
  });
}

export interface MergeResult {
  added: number;
  skipped: number;
}

/**
 * Boeken erbij zetten zonder de bestaande te raken.
 * Dubbel = zelfde ISBN, of zelfde titel + eerste auteur.
 */
export async function mergeBooks(incoming: BookInput[]): Promise<MergeResult> {
  const { books } = getState();
  const isbns = new Set(books.map((b) => b.isbn13).filter(Boolean) as string[]);
  const keys = new Set(books.map((b) => dedupeKey(b)));

  const fresh: BookInput[] = [];
  let skipped = 0;

  for (const raw of incoming) {
    const candidate = prepareBook(raw);
    const key = dedupeKey(candidate);
    if ((candidate.isbn13 && isbns.has(candidate.isbn13)) || keys.has(key)) {
      skipped++;
      continue;
    }
    if (candidate.isbn13) isbns.add(candidate.isbn13);
    keys.add(key);
    fresh.push(candidate);
  }

  if (fresh.length) await saveBooks(fresh);
  return { added: fresh.length, skipped };
}
