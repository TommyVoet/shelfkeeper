import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupIsbn, searchBooks, coverUrlFor } from './openlibrary';

function mockFetch(payload: unknown, ok = true) {
  const fn = vi.fn(async () => ({
    ok,
    status: ok ? 200 : 503,
    json: async () => payload,
  }));
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('searchBooks', () => {
  it('zet een zoekresultaat om naar een boekvoorstel', async () => {
    mockFetch({
      docs: [
        {
          key: '/works/OL659062W',
          title: 'De ontdekking van de hemel',
          author_name: ['Harry Mulisch'],
          first_publish_year: 1992,
          number_of_pages_median: 736,
          publisher: ['De Bezige Bij', 'Gallimard'],
          language: ['dut'],
          cover_i: 8166549,
        },
        { title: '' }, // zonder titel: overslaan
      ],
    });
    const [first, ...rest] = await searchBooks('ontdekking hemel');
    expect(rest).toHaveLength(0);
    expect(first.title).toBe('De ontdekking van de hemel');
    expect(first.authors).toEqual(['Harry Mulisch']);
    expect(first.year).toBe(1992);
    expect(first.publisher).toBe('De Bezige Bij');
    expect(first.coverUrl).toBe(coverUrlFor(8166549));
    // Een zoekresultaat gaat over het werk, niet over jouw uitgave.
    expect(first.isbn13).toBeUndefined();
  });

  it('zoekt niet bij één letter', async () => {
    const fn = mockFetch({ docs: [] });
    expect(await searchBooks('a')).toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });

  it('meldt een storing in plaats van stil te blijven', async () => {
    mockFetch({}, false);
    await expect(searchBooks('iets anders')).rejects.toThrow('503');
  });
});

describe('lookupIsbn', () => {
  it('leest titel, auteur, jaar en omslag uit het antwoord', async () => {
    mockFetch({
      'ISBN:9789023466840': {
        title: 'De ontdekking van de hemel',
        authors: [{ name: 'Harry Mulisch' }],
        publishers: [{ name: 'De Bezige Bij' }],
        publish_date: 'November 1, 2010',
        number_of_pages: 927,
        cover: { medium: 'https://covers.openlibrary.org/b/id/14648050-M.jpg' },
        key: '/books/OL52795440M',
      },
    });
    const found = await lookupIsbn('978-90-234-6684-0');
    expect(found?.title).toBe('De ontdekking van de hemel');
    expect(found?.authors).toEqual(['Harry Mulisch']);
    expect(found?.year).toBe(2010);
    expect(found?.pages).toBe(927);
    expect(found?.isbn13).toBe('9789023466840');
    expect(found?.coverId).toBe(14648050);
  });

  it('geeft null als Open Library het boek niet kent', async () => {
    mockFetch({});
    expect(await lookupIsbn('9780306406157')).toBeNull();
  });

  it('vraagt niets op bij een ongeldig ISBN', async () => {
    const fn = mockFetch({});
    expect(await lookupIsbn('1234567890123')).toBeNull();
    expect(fn).not.toHaveBeenCalled();
  });
});
