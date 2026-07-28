import { describe, expect, it } from 'vitest';
import { booksFromCSV, guessDelimiter, mapColumns, parseCSV } from './csv';
import { interpretSheetUrl } from './sheets';

describe('parseCSV', () => {
  it('leest velden met aanhalingstekens, komma’s en regeleindes', () => {
    const text = 'a,b\n"met, komma","twee""maal"\n"regel\neinde",x\n';
    expect(parseCSV(text)).toEqual([
      ['a', 'b'],
      ['met, komma', 'twee"maal'],
      ['regel\neinde', 'x'],
    ]);
  });

  it('slaat lege regels over', () => {
    expect(parseCSV('a,b\n\n,\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });
});

describe('guessDelimiter', () => {
  it('herkent puntkomma en tab', () => {
    expect(guessDelimiter('a;b;c\n1;2;3')).toBe(';');
    expect(guessDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t');
    expect(guessDelimiter('a,b,c')).toBe(',');
  });
});

describe('mapColumns', () => {
  it('herkent de koppen van Tommy’s Boekenarchief', () => {
    const map = mapColumns(['Auteur - achternaam', 'Auteur - voornaam', 'Titel', 'Oorspronkelijke titel', 'Opmerkingen']);
    expect(map.last).toBe(0);
    expect(map.first).toBe(1);
    expect(map.title).toBe(2);
    expect(map.originalTitle).toBe(3);
    expect(map.notes).toBe(4);
  });

  it('laat "oorspronkelijke titel" niet door "titel" wegvangen', () => {
    const map = mapColumns(['Oorspronkelijke titel', 'Titel']);
    expect(map.originalTitle).toBe(0);
    expect(map.title).toBe(1);
  });

  it('herkent ook Engelse en Franse koppen', () => {
    const en = mapColumns(['Title', 'Author', 'ISBN', 'Year', 'Publisher', 'Pages']);
    expect(en.title).toBe(0);
    expect(en.author).toBe(1);
    expect(en.isbn).toBe(2);
    expect(en.year).toBe(3);
    expect(en.publisher).toBe(4);
    expect(en.pages).toBe(5);
    const fr = mapColumns(['Titre', 'Nom de famille', 'Prénom', 'Éditeur']);
    expect(fr.title).toBe(0);
    expect(fr.last).toBe(1);
    expect(fr.first).toBe(2);
    expect(fr.publisher).toBe(3);
  });
});

describe('booksFromCSV', () => {
  const archief = [
    'Auteur - achternaam,Auteur - voornaam,Titel,Oorspronkelijke titel,Opmerkingen',
    'Ahern,Cecelia,P.S. Ik hou van je,P.S. I Love You',
    'Atwood,Margaret,The Handmaid\'s Tale',
    'Baldacci,Francesca,Vakantie bij Tiffany\'s,Vacanze da Tiffany,',
    ',,,,',
  ].join('\n');

  it('leest het echte archiefbestand', () => {
    const { books, skipped, usedHeader } = booksFromCSV(archief);
    expect(usedHeader).toBe(true);
    expect(books).toHaveLength(3);
    expect(skipped).toBe(0); // helemaal lege regels vallen al bij het lezen weg
    expect(books[0]).toMatchObject({
      title: 'P.S. Ik hou van je',
      authors: ['Cecelia Ahern'],
      originalTitle: 'P.S. I Love You',
    });
    expect(books[1].originalTitle).toBeUndefined();
  });

  it('valt zonder koptekst terug op de vaste kolomvolgorde', () => {
    const { books, usedHeader } = booksFromCSV('Reve,Gerard,De avonden\nClaus,Hugo,Het verdriet van België');
    expect(usedHeader).toBe(false);
    expect(books).toHaveLength(2);
    expect(books[0]).toMatchObject({ title: 'De avonden', authors: ['Gerard Reve'] });
  });

  it('leest één auteurskolom en splitst meerdere auteurs', () => {
    const { books } = booksFromCSV('Titel,Auteur\nGoede voortekenen,Terry Pratchett & Neil Gaiman');
    expect(books[0].authors).toEqual(['Terry Pratchett', 'Neil Gaiman']);
  });

  it('leest ISBN, jaar en pagina’s als getal', () => {
    const { books } = booksFromCSV('Titel;ISBN;Jaar;Pagina\'s\nDune;9780306406157;1965;412');
    expect(books[0]).toMatchObject({ isbn13: '9780306406157', year: 1965, pages: 412 });
  });
});

describe('interpretSheetUrl', () => {
  it('gebruikt export?format=csv en houdt gviz als reserve', () => {
    const s = interpretSheetUrl('https://docs.google.com/spreadsheets/d/1AbC_dEf-123/edit#gid=42');
    expect(s?.csv).toBe('https://docs.google.com/spreadsheets/d/1AbC_dEf-123/export?format=csv&gid=42');
    expect(s?.csvAlt).toContain('/gviz/tq');
    expect(s?.edit).toBe('https://docs.google.com/spreadsheets/d/1AbC_dEf-123/edit');
  });

  it('herkent een gepubliceerde link', () => {
    const s = interpretSheetUrl('https://docs.google.com/spreadsheets/d/e/2PACX-abc/pubhtml');
    expect(s?.csv).toBe('https://docs.google.com/spreadsheets/d/e/2PACX-abc/pub?output=csv');
  });

  it('laat een gewone CSV-link staan', () => {
    expect(interpretSheetUrl('https://example.com/boeken.csv')?.csv).toBe('https://example.com/boeken.csv');
    expect(interpretSheetUrl('   ')).toBeNull();
  });
});
