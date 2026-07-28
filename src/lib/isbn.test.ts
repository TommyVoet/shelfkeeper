import { describe, expect, it } from 'vitest';
import {
  cleanIsbn,
  isBookBarcode,
  isbn10to13,
  isbn13to10,
  isbnKey,
  isValidIsbn10,
  isValidIsbn13,
} from './isbn';

describe('cleanIsbn', () => {
  it('haalt streepjes en spaties weg', () => {
    expect(cleanIsbn('978-90-284-5257-2')).toBe('9789028452572');
    expect(cleanIsbn(' 0-306-40615-x ')).toBe('030640615X');
    expect(cleanIsbn(null)).toBe('');
  });
});

describe('controlecijfer', () => {
  it('keurt geldige ISBN-10 goed', () => {
    expect(isValidIsbn10('0306406152')).toBe(true);
    expect(isValidIsbn10('043942089X')).toBe(true); // X als controleteken
  });

  it('keurt een verkeerd controlecijfer af', () => {
    expect(isValidIsbn10('0306406153')).toBe(false);
    expect(isValidIsbn13('9780306406158')).toBe(false);
  });

  it('keurt geldige ISBN-13 goed', () => {
    expect(isValidIsbn13('9780306406157')).toBe(true);
    expect(isValidIsbn13('9789028452572')).toBe(true);
  });

  it('keurt te korte of te lange codes af', () => {
    expect(isValidIsbn13('978030640615')).toBe(false);
    expect(isValidIsbn10('030640615')).toBe(false);
  });
});

describe('omzetten', () => {
  it('zet ISBN-10 om naar ISBN-13 en terug', () => {
    expect(isbn10to13('0306406152')).toBe('9780306406157');
    expect(isbn13to10('9780306406157')).toBe('0306406152');
  });

  it('geeft null voor een 979-code, die heeft geen ISBN-10', () => {
    expect(isbn13to10('9791234567896')).toBe(null);
  });

  it('isbnKey maakt van alles de ISBN-13-vorm', () => {
    expect(isbnKey('0-306-40615-2')).toBe('9780306406157');
    expect(isbnKey('9789028452572')).toBe('9789028452572');
    expect(isbnKey('rommel')).toBe(null);
    expect(isbnKey('')).toBe(null);
    expect(isbnKey(undefined)).toBe(null);
  });
});

describe('isBookBarcode', () => {
  it('accepteert 978 en 979', () => {
    expect(isBookBarcode('9780306406157')).toBe(true);
    expect(isBookBarcode('9791234567896')).toBe(true);
  });

  it('wijst gewone winkelproducten af', () => {
    expect(isBookBarcode('5449000000996')).toBe(false); // frisdrank
    expect(isBookBarcode('12345')).toBe(false); // prijstoevoeging
  });
});
