/** ISBN opschonen, controleren en omzetten. */

/** Alleen cijfers en een eventuele X; streepjes en spaties eruit. */
export function cleanIsbn(raw: string | null | undefined): string {
  return (raw ?? '').replace(/[^0-9Xx]/g, '').toUpperCase();
}

export function isValidIsbn10(raw: string): boolean {
  const s = cleanIsbn(raw);
  if (s.length !== 10) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const d = s.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    sum += (10 - i) * d;
  }
  const last = s[9];
  const check = last === 'X' ? 10 : last.charCodeAt(0) - 48;
  if (check < 0 || check > 10) return false;
  return (sum + check) % 11 === 0;
}

export function isValidIsbn13(raw: string): boolean {
  const s = cleanIsbn(raw);
  if (s.length !== 13 || /[^0-9]/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += (s.charCodeAt(i) - 48) * (i % 2 === 0 ? 1 : 3);
  }
  return sum % 10 === 0;
}

export function isValidIsbn(raw: string): boolean {
  const s = cleanIsbn(raw);
  return s.length === 10 ? isValidIsbn10(s) : isValidIsbn13(s);
}

/** ISBN-10 → ISBN-13 (978-voorvoegsel), zodat we op één sleutel kunnen vergelijken. */
export function isbn10to13(raw: string): string | null {
  const s = cleanIsbn(raw);
  if (!isValidIsbn10(s)) return null;
  const core = '978' + s.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += (core.charCodeAt(i) - 48) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return core + check;
}

/** ISBN-13 (978-…) → ISBN-10, of null als dat niet kan. */
export function isbn13to10(raw: string): string | null {
  const s = cleanIsbn(raw);
  if (!isValidIsbn13(s) || !s.startsWith('978')) return null;
  const core = s.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (10 - i) * (core.charCodeAt(i) - 48);
  const rest = (11 - (sum % 11)) % 11;
  return core + (rest === 10 ? 'X' : String(rest));
}

/**
 * De sleutel waarop we boeken vergelijken: altijd ISBN-13.
 * Geeft null bij een ongeldige of ontbrekende code, zodat er nooit op rommel
 * gematcht wordt.
 */
export function isbnKey(raw: string | null | undefined): string | null {
  const s = cleanIsbn(raw);
  if (!s) return null;
  if (s.length === 13) return isValidIsbn13(s) ? s : null;
  if (s.length === 10) return isbn10to13(s);
  return null;
}

/**
 * Streepjescodes op boeken zijn EAN-13. Codes die met 978/979 beginnen zijn
 * boeken; alle andere (bijv. 5-cijferige prijstoevoegingen of gewone
 * winkelproducten) wijzen we af zodat we geen onzin opzoeken.
 */
export function isBookBarcode(raw: string): boolean {
  const s = cleanIsbn(raw);
  return s.length === 13 && (s.startsWith('978') || s.startsWith('979')) && isValidIsbn13(s);
}
