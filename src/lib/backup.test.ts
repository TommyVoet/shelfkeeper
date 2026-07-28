import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { BackupError, buildBackup, backupFileName, mergeBooks, parseBackup, restoreBackup } from './backup';
import * as store from './store';

describe('back-up en samenvoegen', () => {
  beforeAll(async () => {
    await store.init();
    await store.saveBook({ title: 'Dune', authors: ['Frank Herbert'], isbn13: '9780306406157' });
    await store.saveBook({ title: 'De avonden', authors: ['Gerard Reve'] });
  });

  it('zet de hele collectie in één bestand', () => {
    const b = buildBackup(new Date('2026-07-28T10:00:00Z'));
    expect(b.app).toBe('shelfkeeper');
    expect(b.books).toHaveLength(2);
    expect(b.exportedAt).toBe('2026-07-28T10:00:00.000Z');
    expect(backupFileName(new Date('2026-07-28T10:00:00Z'))).toBe('shelfkeeper-2026-07-28.json');
  });

  it('weigert een bestand dat van ergens anders komt', () => {
    expect(() => parseBackup('geen json')).toThrow(BackupError);
    expect(() => parseBackup('{"app":"iets anders","books":[]}')).toThrow(BackupError);
    expect(() => parseBackup('{"app":"shelfkeeper","format":99,"books":[]}')).toThrow(
      /nieuwere versie/,
    );
  });

  it('slaat bij samenvoegen over wat je al hebt', async () => {
    const result = await mergeBooks([
      { title: 'Dune (pocket)', authors: ['Frank Herbert'], isbn10: '0306406152' }, // zelfde ISBN
      { title: 'de Avonden', authors: ['gerard reve'] }, // zelfde titel + auteur
      { title: 'Ilias', authors: ['Homerus'] }, // nieuw
    ]);
    expect(result).toEqual({ added: 1, skipped: 2 });
    expect(store.getState().books).toHaveLength(3);
  });

  it('zet een back-up terug en gooit wat er stond weg', async () => {
    const snapshot = parseBackup(JSON.stringify(buildBackup()));
    await store.saveBook({ title: 'Later toegevoegd' });
    expect(store.getState().books).toHaveLength(4);

    await restoreBackup(snapshot);
    expect(store.getState().books).toHaveLength(3);
    expect(store.getState().books.some((b) => b.title === 'Later toegevoegd')).toBe(false);
    // afgeleide velden worden opnieuw berekend, ook uit een oud bestand
    expect(store.getState().books.find((b) => b.title === 'Dune')?.sortKey).toBe('herbert, frank');
  });
});
