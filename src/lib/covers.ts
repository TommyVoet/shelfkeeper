/**
 * Omslagen. Een boek heeft óf een offline kopie in IndexedDB (coverKey),
 * óf alleen een adres op internet (coverUrl), óf niets — dan tekent de app
 * zelf een rug met de beginletter.
 */
import { useEffect, useState } from 'preact/hooks';
import { getCover } from './db';
import type { Book } from './types';

/** Object-URL's hergebruiken; anders lekt elke render geheugen. */
const objectUrls = new Map<string, string>();

export async function coverObjectUrl(key: string): Promise<string | null> {
  const cached = objectUrls.get(key);
  if (cached) return cached;
  const blob = await getCover(key);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  objectUrls.set(key, url);
  return url;
}

export function forgetCoverUrl(key: string): void {
  const url = objectUrls.get(key);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrls.delete(key);
  }
}

/** Adres van de omslag, of null als er geen is. */
export function useCoverSrc(book: Pick<Book, 'coverKey' | 'coverUrl'>): string | null {
  const [src, setSrc] = useState<string | null>(() =>
    book.coverKey ? (objectUrls.get(book.coverKey) ?? null) : (book.coverUrl ?? null),
  );

  useEffect(() => {
    let alive = true;
    if (book.coverKey) {
      const cached = objectUrls.get(book.coverKey);
      if (cached) {
        setSrc(cached);
      } else {
        void coverObjectUrl(book.coverKey).then((url) => {
          if (alive) setSrc(url ?? book.coverUrl ?? null);
        });
      }
    } else {
      setSrc(book.coverUrl ?? null);
    }
    return () => {
      alive = false;
    };
  }, [book.coverKey, book.coverUrl]);

  return src;
}

/** Vaste kleur per titel, zodat een boek er elke keer hetzelfde uitziet. */
const SPINE_HUES = [12, 30, 96, 150, 186, 210, 258, 292, 330];

export function spineHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return SPINE_HUES[h % SPINE_HUES.length];
}

/** Eén of twee letters voor op de zelfgetekende rug. */
export function coverInitials(title: string): string {
  const words = (title ?? '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
