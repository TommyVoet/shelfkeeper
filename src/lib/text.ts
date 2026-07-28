/**
 * Tekstgereedschap voor zoeken.
 * Overgenomen uit Boekenzoeker (norm + highlight met index-kaart) en hier
 * uitgebreid: highlight geeft nu stukjes terug in plaats van HTML, zodat
 * Preact ze veilig kan tekenen zonder innerHTML.
 */

/** Accent-, hoofdletter- en apostrof-ongevoelige vorm van een tekst. */
export function norm(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['‘’´`]/g, '')
    .toLowerCase();
}

/** Zoekwoorden uit een zoekopdracht; leeg als er niets ingevuld is. */
export function tokenize(query: string): string[] {
  return norm(query).split(/\s+/).filter(Boolean);
}

/** Alle woorden moeten voorkomen (EN-zoeken), net als in Boekenzoeker. */
export function matchesTokens(haystack: string, tokens: string[]): boolean {
  return tokens.every((t) => haystack.includes(t));
}

export interface Segment {
  text: string;
  hit: boolean;
}

/**
 * Splitst tekst in stukjes met en zonder treffer.
 * Werkt ook als het zoekwoord accenten mist ("brontë" ↔ "bronte"): er wordt een
 * kaart per teken bijgehouden tussen de originele en de genormaliseerde tekst.
 */
export function highlight(text: string, tokens: string[]): Segment[] {
  if (!text) return [];
  if (!tokens.length) return [{ text, hit: false }];

  let normText = '';
  const map: number[] = []; // map[i] = index in de originele tekst
  for (let oi = 0; oi < text.length; oi++) {
    const nc = norm(text[oi]);
    for (let k = 0; k < nc.length; k++) {
      normText += nc[k];
      map.push(oi);
    }
  }

  const hit = new Array<boolean>(text.length).fill(false);
  for (const t of tokens) {
    if (!t) continue;
    let from = 0;
    let i: number;
    while ((i = normText.indexOf(t, from)) !== -1) {
      const start = map[i];
      const end = map[i + t.length - 1];
      for (let o = start; o <= end; o++) hit[o] = true;
      from = i + t.length;
    }
  }

  const out: Segment[] = [];
  let j = 0;
  while (j < text.length) {
    const on = hit[j];
    let seg = '';
    while (j < text.length && hit[j] === on) {
      seg += text[j];
      j++;
    }
    out.push({ text: seg, hit: on });
  }
  return out;
}

/**
 * Splitst een auteursnaam in voor- en achternaam.
 *
 * Regels, in deze volgorde:
 *  - "Achternaam, Voornaam" (komma) wordt letterlijk overgenomen;
 *  - een tussenvoegsel met kleine letter hoort bij de weergave maar niet bij de
 *    sorteersleutel ("Jan van Aken" → Aken, Jan van) — de Nederlandse gewoonte;
 *  - een tussenvoegsel met hoofdletter hoort er wél bij ("Jan Van Aken" →
 *    Van Aken, Jan) — de Vlaamse en Franse gewoonte.
 */
const PARTICLES = new Set([
  // Nederlands/Vlaams
  'van', 'de', 'den', 'der', 'ten', 'ter', 'te', 'op', 'in', "'t",
  // Duits
  'von', 'zu',
  // Frans
  'du', 'des', 'la', 'le',
  // Italiaans/Spaans/Portugees
  'di', 'del', 'della', 'da', 'das', 'dos',
]);

export interface SplitName {
  first: string;
  last: string;
  /** Tussenvoegsel met kleine letter, alleen voor de weergave. */
  particle: string;
}

export function splitName(full: string): SplitName {
  const name = (full ?? '').trim().replace(/\s+/g, ' ');
  if (!name) return { first: '', last: '', particle: '' };

  const comma = name.indexOf(',');
  if (comma > 0) {
    return {
      last: name.slice(0, comma).trim(),
      first: name.slice(comma + 1).trim(),
      particle: '',
    };
  }

  const parts = name.split(' ');
  if (parts.length === 1) return { first: '', last: parts[0], particle: '' };

  let lastIdx = parts.length - 1;
  const particles: string[] = [];
  // Loop terug over tussenvoegsels vóór de achternaam: "van der Meer"
  let i = lastIdx - 1;
  while (i > 0 && PARTICLES.has(parts[i].toLowerCase())) {
    const isLower = parts[i][0] === parts[i][0].toLowerCase();
    if (isLower) {
      particles.unshift(parts[i]);
      i--;
    } else {
      // Hoofdletter: hoort bij de achternaam zelf.
      lastIdx = i;
      i--;
    }
  }

  return {
    first: parts.slice(0, i + 1).join(' '),
    last: parts.slice(lastIdx).join(' '),
    particle: particles.join(' '),
  };
}

/** "Harry Mulisch" → "Mulisch, Harry"; "Jan van Aken" → "Aken, Jan van". */
export function authorSortName(full: string): string {
  const { first, last, particle } = splitName(full);
  if (!last) return first;
  if (!first && !particle) return last;
  const tail = [first, particle].filter(Boolean).join(' ');
  return tail ? `${last}, ${tail}` : last;
}
