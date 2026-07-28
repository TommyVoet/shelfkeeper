import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import en from './en.json';
import nl from './nl.json';
import fr from './fr.json';
import { LOCALES, resolveLocale, translate } from './index';

const SRC = join(import.meta.dirname, '..');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(entry) && !entry.endsWith('.test.ts')) out.push(full);
  }
  return out;
}

/** Alleen letterlijke sleutels; t(`status.${s}`) valt hier buiten. */
function usedKeys(): Set<string> {
  const keys = new Set<string>();
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/\bt\(\s*'([a-zA-Z0-9._-]+)'/g)) keys.add(m[1]);
  }
  return keys;
}

describe('vertalingen', () => {
  it('alle drie de talen hebben dezelfde sleutels', () => {
    const enKeys = Object.keys(en).sort();
    expect(Object.keys(nl).sort()).toEqual(enKeys);
    expect(Object.keys(fr).sort()).toEqual(enKeys);
  });

  it('geen lege vertalingen', () => {
    for (const [name, dict] of [['en', en], ['nl', nl], ['fr', fr]] as const) {
      const empty = Object.entries(dict).filter(([, v]) => !String(v).trim());
      expect(empty, `lege waarden in ${name}.json`).toEqual([]);
    }
  });

  it('elke sleutel die de app gebruikt bestaat', () => {
    // Meervoudssleutels staan als `_one`/`_other` in het bestand.
    const known = (k: string) => k in en || `${k}_one` in en || `${k}_other` in en;
    const missing = [...usedKeys()].filter((k) => !known(k));
    expect(missing).toEqual([]);
  });

  it('vult plaatshouders in en kiest de juiste meervoudsvorm', () => {
    expect(translate('nl', 'common.books', { count: 1 })).toBe('1 boek');
    expect(translate('nl', 'common.books', { count: 7 })).toBe('7 boeken');
    expect(translate('fr', 'library.countFiltered', { shown: 2, total: 9 })).toBe('2 sur 9');
  });

  it('valt terug op Engels en daarna op de sleutel zelf', () => {
    expect(translate('nl', 'zzz.bestaat.niet')).toBe('zzz.bestaat.niet');
  });

  it('herkent de taal van het toestel', () => {
    expect(resolveLocale('nl-BE')).toBe('nl');
    expect(resolveLocale('fr-FR')).toBe('fr');
    expect(resolveLocale('de-DE')).toBeNull();
    expect(LOCALES).toEqual(['en', 'nl', 'fr']);
  });
});
