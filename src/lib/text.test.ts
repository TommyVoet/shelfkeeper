import { describe, expect, it } from 'vitest';
import { authorSortName, highlight, matchesTokens, norm, splitName, tokenize } from './text';

describe('norm', () => {
  it('haalt accenten, hoofdletters en apostroffen weg', () => {
    expect(norm('Brontë')).toBe('bronte');
    expect(norm("L'Étranger")).toBe('letranger');
    expect(norm('Müller')).toBe('muller');
    expect(norm('Ça ira')).toBe('ca ira');
    expect(norm(undefined)).toBe('');
  });
});

describe('tokenize + matchesTokens', () => {
  it('splitst op spaties en eist alle woorden', () => {
    const t = tokenize('  harry  mulisch ');
    expect(t).toEqual(['harry', 'mulisch']);
    expect(matchesTokens('de ontdekking van de hemel harry mulisch', t)).toBe(true);
    expect(matchesTokens('harry potter', t)).toBe(false);
  });

  it('vindt woorden zonder accenten', () => {
    expect(matchesTokens(norm('Emily Brontë'), tokenize('bronte'))).toBe(true);
  });
});

describe('highlight', () => {
  it('geeft de tekst ongewijzigd terug zonder zoekwoorden', () => {
    expect(highlight('Dune', [])).toEqual([{ text: 'Dune', hit: false }]);
  });

  it('markeert het trefferstuk', () => {
    expect(highlight('Dune Messiah', ['mess'])).toEqual([
      { text: 'Dune ', hit: false },
      { text: 'Mess', hit: true },
      { text: 'iah', hit: false },
    ]);
  });

  it('markeert ook door accenten heen', () => {
    const segs = highlight('Emily Brontë', ['bronte']);
    expect(segs.map((s) => s.text).join('')).toBe('Emily Brontë');
    expect(segs.find((s) => s.hit)?.text).toBe('Brontë');
  });

  it('houdt de originele tekst compleet bij meerdere woorden', () => {
    const segs = highlight("L'Étranger van Camus", ['letranger', 'camus']);
    expect(segs.map((s) => s.text).join('')).toBe("L'Étranger van Camus");
    expect(segs.filter((s) => s.hit).map((s) => s.text)).toEqual(["L'Étranger", 'Camus']);
  });
});

describe('splitName / authorSortName', () => {
  it('draait voornaam en achternaam om', () => {
    expect(authorSortName('Harry Mulisch')).toBe('Mulisch, Harry');
  });

  it('laat een naam uit één woord met rust', () => {
    expect(authorSortName('Homerus')).toBe('Homerus');
    expect(splitName('Homerus')).toEqual({ first: '', last: 'Homerus', particle: '' });
  });

  it('sorteert een Nederlands tussenvoegsel met kleine letter op de achternaam', () => {
    expect(authorSortName('Jan van Aken')).toBe('Aken, Jan van');
    expect(authorSortName('Jan van der Meer')).toBe('Meer, Jan van der');
  });

  it('houdt een Vlaams tussenvoegsel met hoofdletter bij de achternaam', () => {
    expect(authorSortName('Jan Van Aken')).toBe('Van Aken, Jan');
  });

  it('herkent Franse en Engelse samengestelde achternamen', () => {
    expect(authorSortName('Jean de La Fontaine')).toBe('La Fontaine, Jean de');
    expect(authorSortName('Ursula K. Le Guin')).toBe('Le Guin, Ursula K.');
  });

  it('neemt "Achternaam, Voornaam" letterlijk over', () => {
    expect(authorSortName('Mulisch, Harry')).toBe('Mulisch, Harry');
  });

  it('kan om met lege invoer', () => {
    expect(authorSortName('')).toBe('');
    expect(authorSortName('   ')).toBe('');
  });
});
