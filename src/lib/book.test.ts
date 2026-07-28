import { describe, expect, it } from 'vitest';
import { dedupeKey, prepareBook, stripLeadingArticle } from './book';
import { firstLetterOf, presentLetters, sortBooks } from './sort';
import { computeStats } from './stats';
import type { Book } from './types';

const make = (title: string, authors: string[] = [], extra: Partial<Book> = {}) =>
  prepareBook({ title, authors, ...extra });

describe('prepareBook', () => {
  it('leidt sorteersleutel en zoektekst af', () => {
    const b = make('De ontdekking van de hemel', ['Harry Mulisch']);
    expect(b.authorSort).toBe('Mulisch, Harry');
    expect(b.sortKey).toBe('mulisch, harry');
    expect(b.titleKey).toBe('ontdekking van de hemel');
    expect(b.hay).toContain('mulisch');
    expect(b.hay).toContain('ontdekking');
  });

  it('vult beide ISBN-vormen aan vanuit één opgegeven code', () => {
    const b = make('Dune', ['Frank Herbert'], { isbn10: '0306406152' });
    expect(b.isbn13).toBe('9780306406157');
    expect(b.isbn10).toBe('0306406152');
  });

  it('negeert een ISBN die niet klopt', () => {
    const b = make('Dune', [], { isbn13: '1234567890123' });
    expect(b.isbn13).toBeUndefined();
  });

  it('sorteert een boek zonder auteur op titel in plaats van bovenaan', () => {
    const b = make('Atlas van de wereld');
    expect(b.sortKey).toBe('atlas van de wereld');
  });

  it('zet lege tekstvelden om naar undefined en behoudt addedAt', () => {
    const first = make('Dune', ['Frank Herbert'], { notes: '   ' });
    expect(first.notes).toBeUndefined();
    const again = prepareBook({ ...first, title: 'Dune Messiah' });
    expect(again.addedAt).toBe(first.addedAt);
    expect(again.id).toBe(first.id);
  });
});

describe('stripLeadingArticle', () => {
  it('haalt lidwoorden weg voor het sorteren', () => {
    expect(stripLeadingArticle('The Hobbit')).toBe('Hobbit');
    expect(stripLeadingArticle('De avonden')).toBe('avonden');
    expect(stripLeadingArticle('Les Misérables')).toBe('Misérables');
    expect(stripLeadingArticle('Dune')).toBe('Dune');
  });
});

describe('sortBooks', () => {
  const books = [
    make('Dune', ['Frank Herbert']),
    make('De avonden', ['Gerard Reve']),
    make('Ilias', ['Homerus']),
    make('Atlas'),
    make('Het verdriet van België', ['Hugo Claus']),
  ];

  it('sorteert op achternaam, ook bij auteurs met één naam', () => {
    const names = sortBooks(books, 'author').map((b) => b.authorSort || b.title);
    expect(names).toEqual([
      'Atlas',
      'Claus, Hugo',
      'Herbert, Frank',
      'Homerus',
      'Reve, Gerard',
    ]);
  });

  it('sorteert op titel zonder lidwoord', () => {
    const titles = sortBooks(books, 'title').map((b) => b.title);
    expect(titles).toEqual([
      'Atlas',
      'De avonden',
      'Dune',
      'Ilias',
      'Het verdriet van België',
    ]);
  });

  it('sorteert op laatst toegevoegd, nieuwste eerst', () => {
    const a = prepareBook({ title: 'Oud' }, 1000);
    const b = prepareBook({ title: 'Nieuw' }, 2000);
    expect(sortBooks([a, b], 'added').map((x) => x.title)).toEqual(['Nieuw', 'Oud']);
  });
});

describe('A–Z-balk', () => {
  it('volgt de gekozen sorteervolgorde', () => {
    const b = make('Dune', ['Frank Herbert']);
    expect(firstLetterOf(b, 'author')).toBe('H');
    expect(firstLetterOf(b, 'title')).toBe('D');
  });

  it('zet cijfers en tekens onder # en achteraan', () => {
    const books = [make('1984', ['George Orwell']), make('Atlas'), make('#tags')];
    // Op titel: "1984" en "#tags" vallen samen onder #.
    expect(presentLetters(books, 'title')).toEqual(['A', '#']);
    // Op auteur: "1984" staat onder Orwell, "Atlas" en "#tags" hebben er geen.
    expect(presentLetters(books, 'author')).toEqual(['A', 'O', '#']);
  });
});

describe('computeStats', () => {
  it('telt boeken, auteurs en pagina’s', () => {
    const s = computeStats([
      make('Dune', ['Frank Herbert'], { pages: 412 }),
      make('Dune Messiah', ['Frank Herbert'], { pages: 256, status: 'read' }),
      make('Ilias', ['Homerus']),
    ]);
    expect(s.total).toBe(3);
    expect(s.authors).toBe(2);
    expect(s.pages).toBe(668);
    expect(s.read).toBe(1);
    expect(s.topAuthors[0]).toEqual({ name: 'Frank Herbert', count: 2 });
  });

  it('vindt dubbel ingevoerde boeken op titel + auteur', () => {
    const s = computeStats([
      make('De avonden', ['Gerard Reve']),
      make('de Avonden', ['Gerard Reve']),
      make('Ilias', ['Homerus']),
    ]);
    expect(s.duplicates).toHaveLength(1);
    expect(s.duplicates[0].count).toBe(2);
  });

  it('herkent dubbels op ISBN, ook bij een andere schrijfwijze van de titel', () => {
    const s = computeStats([
      make('Dune', ['Frank Herbert'], { isbn13: '9780306406157' }),
      make('Dune (herdruk)', ['F. Herbert'], { isbn10: '0306406152' }),
    ]);
    expect(s.duplicates).toHaveLength(1);
  });
});

describe('dedupeKey', () => {
  it('negeert lidwoord, hoofdletters en accenten', () => {
    expect(dedupeKey({ title: 'De Avonden', authors: ['Gerard Reve'] })).toBe(
      dedupeKey({ title: 'avonden', authors: ['gerard reve'] }),
    );
  });
});
