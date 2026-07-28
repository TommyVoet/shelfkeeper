/**
 * Alleen tijdens ontwikkelen: vult de collectie met testboeken.
 * In de console:  __seed(2200)   /   __wipe()
 * Wordt niet meegebouwd in de productieversie (zie main.tsx).
 */
import * as store from '../lib/store';
import { saveBooks } from '../lib/store';
import { createScanner, hasNativeScanner } from '../lib/scan/barcode';
import { clearAll } from '../lib/db';
import { newId } from '../lib/book';
import type { BookInput, BookStatus } from '../lib/types';

const TITLES = [
  'De ontdekking van de hemel', 'Het verdriet van België', 'De avonden', 'Max Havelaar',
  'Turks fruit', 'Oeroeg', 'De donkere kamer van Damokles', 'Nooit meer slapen',
  'Dune', 'Ilias', 'Odyssee', 'Het achterhuis', 'De aanslag', 'Bezonken rood',
  'Kaas', 'De kleine blonde dood', 'Wij', 'De vliegeraar', 'Schaduwkind',
  'Het diner', 'De helaasheid der dingen', 'Congo', 'Grand Hotel Europa',
  "L'Étranger", 'Le Petit Prince', 'Madame Bovary', 'Les Misérables',
  'The Hobbit', 'Nineteen Eighty-Four', 'Brave New World', 'Wuthering Heights',
];

const AUTHORS = [
  'Harry Mulisch', 'Hugo Claus', 'Gerard Reve', 'Multatuli', 'Jan Wolkers',
  'Hella Haasse', 'Willem Frederik Hermans', 'Frank Herbert', 'Homerus',
  'Anne Frank', 'Jeroen Brouwers', 'Willem Elsschot', 'Jan van Aken',
  'Jan Van Aken', 'Dimitri Verhulst', 'David Van Reybrouck', 'Ilja Leonard Pfeijffer',
  'Albert Camus', 'Antoine de Saint-Exupéry', 'Gustave Flaubert', 'Victor Hugo',
  'J.R.R. Tolkien', 'George Orwell', 'Aldous Huxley', 'Emily Brontë',
  'Ursula K. Le Guin', 'Jean de La Fontaine', 'Herman Koch', 'Khaled Hosseini',
];

const PUBLISHERS = ['De Bezige Bij', 'Querido', 'Atlas Contact', 'Gallimard', 'Penguin'];
const STATUSES: BookStatus[] = ['owned', 'owned', 'owned', 'read', 'reading', 'wishlist'];

/** Voorspelbare pseudo-toevalsgetallen, zodat twee runs dezelfde set geven. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export async function seed(count = 500): Promise<number> {
  const rand = rng(42);
  const books: BookInput[] = [];
  for (let i = 0; i < count; i++) {
    const title = TITLES[Math.floor(rand() * TITLES.length)];
    const author = AUTHORS[Math.floor(rand() * AUTHORS.length)];
    const withIsbn = rand() > 0.3;
    books.push({
      id: newId() + i.toString(36),
      title: i < TITLES.length ? title : `${title} ${Math.floor(rand() * 900) + 100}`,
      authors: [author],
      publisher: PUBLISHERS[Math.floor(rand() * PUBLISHERS.length)],
      year: 1950 + Math.floor(rand() * 75),
      pages: 120 + Math.floor(rand() * 600),
      status: STATUSES[Math.floor(rand() * STATUSES.length)],
      rating: Math.floor(rand() * 6),
      isbn13: withIsbn ? undefined : undefined,
      source: 'import',
      addedAt: Date.now() - Math.floor(rand() * 3e8),
    });
  }
  await saveBooks(books);
  return books.length;
}

export async function wipe(): Promise<void> {
  await clearAll();
  location.reload();
}

declare global {
  interface Window {
    __seed: typeof seed;
    __wipe: typeof wipe;
    __store: typeof store;
    __scan: { createScanner: typeof createScanner; hasNativeScanner: typeof hasNativeScanner };
  }
}

export function installDevHelpers(): void {
  window.__seed = seed;
  window.__wipe = wipe;
  window.__store = store;
  // Zo is de streepjescodelezer ook zonder camera te proberen, op een canvas.
  window.__scan = { createScanner, hasNativeScanner };
  console.info('[dev] __seed(n), __wipe(), __store en __scan staan klaar');
}
