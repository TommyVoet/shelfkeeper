import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import * as store from './store';
import * as db from './db';

describe('opslag en geheugen blijven gelijk', () => {
  beforeAll(async () => {
    await store.init();
  });

  it('begint leeg', () => {
    const s = store.getState();
    expect(s.ready).toBe(true);
    expect(s.books).toHaveLength(0);
  });

  it('bewaart een boek in het geheugen én in de database', async () => {
    const book = await store.saveBook({
      title: 'De ontdekking van de hemel',
      authors: ['Harry Mulisch'],
      isbn13: '9789023466536',
      source: 'manual',
    });
    expect(store.getState().books).toHaveLength(1);
    expect(book.authorSort).toBe('Mulisch, Harry');

    const fromDb = await db.getBook(book.id);
    expect(fromDb?.title).toBe('De ontdekking van de hemel');
    expect(fromDb?.sortKey).toBe('mulisch, harry');
  });

  it('werkt een bestaand boek bij in plaats van het te verdubbelen', async () => {
    const [first] = store.getState().books;
    const updated = await store.saveBook({ id: first.id, title: first.title, rating: 4 });
    expect(store.getState().books).toHaveLength(1);
    expect(updated.rating).toBe(4);
    expect(updated.authors).toEqual(['Harry Mulisch']); // niet weggegooid
    expect(updated.addedAt).toBe(first.addedAt);
  });

  it('vindt een boek terug op ISBN, ook via de ISBN-10-vorm', async () => {
    await store.saveBook({ title: 'Dune', authors: ['Frank Herbert'], isbn10: '0306406152' });
    expect(store.bookByIsbn('9780306406157')?.title).toBe('Dune');
    expect(await db.findBookByIsbn('9780306406157')).toBeTruthy();
  });

  it('haalt een verwijderde plank overal weg, maar houdt de boeken', async () => {
    const shelf = await store.createShelf('Woonkamer');
    const [book] = store.getState().books;
    await store.saveBook({ id: book.id, title: book.title, shelfIds: [shelf.id] });
    expect(store.getState().books.find((b) => b.id === book.id)?.shelfIds).toEqual([shelf.id]);

    await store.removeShelf(shelf.id);
    expect(store.getState().shelves).toHaveLength(0);
    expect(store.getState().books.find((b) => b.id === book.id)?.shelfIds).toEqual([]);
    expect((await db.getBook(book.id))?.shelfIds).toEqual([]);
  });

  it('houdt uitleningen bij en sluit ze af', async () => {
    const [book] = store.getState().books;
    const loan = await store.lendBook(book.id, 'Mama');
    expect(store.openLoanFor(book.id)?.person).toBe('Mama');
    await store.returnLoan(loan.id);
    expect(store.openLoanFor(book.id)).toBeUndefined();
    expect(store.openLoans()).toHaveLength(0);
  });

  it('verwijdert een boek samen met zijn uitleningen', async () => {
    const [book] = store.getState().books;
    await store.lendBook(book.id, 'Buurman');
    await store.removeBook(book.id);
    expect(store.getState().books.some((b) => b.id === book.id)).toBe(false);
    expect(store.getState().loans.some((l) => l.bookId === book.id)).toBe(false);
    expect(await db.getBook(book.id)).toBeUndefined();
    expect((await db.allLoans()).some((l) => l.bookId === book.id)).toBe(false);
  });
});
