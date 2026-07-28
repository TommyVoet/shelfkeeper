import { useRef, useState } from 'preact/hooks';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { useT } from '../i18n';
import { downloadBackup, mergeBooks, parseBackup, restoreBackup } from '../lib/backup';
import { booksFromCSV } from '../lib/import/csv';
import { fetchSheetCsv, interpretSheetUrl } from '../lib/import/sheets';
import { clearAll } from '../lib/db';
import { useStore } from '../lib/store';
import { ROUTES } from '../lib/routes';

type Message = { kind: 'ok' | 'error'; text: string } | null;

export function Data() {
  const t = useT();
  const { books } = useStore();
  const [message, setMessage] = useState<Message>(null);
  const [sheetUrl, setSheetUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const backupInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);

  const fail = (e: unknown) =>
    setMessage({ kind: 'error', text: t('data.error', { message: (e as Error).message }) });

  const onBackupFile = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    (e.target as HTMLInputElement).value = '';
    if (!file) return;
    try {
      const backup = parseBackup(await file.text());
      if (!confirm(t('data.importConfirm'))) return;
      setBusy(true);
      await restoreBackup(backup);
      setMessage({ kind: 'ok', text: t('data.restored', { count: backup.books.length }) });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const importText = async (text: string) => {
    const { books: incoming, skipped } = booksFromCSV(text);
    if (!incoming.length) throw new Error(t('add.search.noResults'));
    const result = await mergeBooks(incoming);
    setMessage({
      kind: 'ok',
      text: t('data.merged', { added: result.added, skipped: result.skipped + skipped }),
    });
  };

  const onCsvFile = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    (e.target as HTMLInputElement).value = '';
    if (!file) return;
    setBusy(true);
    try {
      await importText(await file.text());
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const onSheet = async (e: Event) => {
    e.preventDefault();
    const source = interpretSheetUrl(sheetUrl);
    if (!source) return;
    setBusy(true);
    try {
      await importText(await fetchSheetCsv(source));
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const wipe = async () => {
    if (!confirm(t('data.dangerConfirm'))) return;
    setBusy(true);
    try {
      await clearAll();
      location.href = ROUTES.library;
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TopBar title={t('data.title')} back={ROUTES.more} />
      <main class="page">
        <p class="hint">{t('common.books', { count: books.length })}</p>

        {message && (
          <p class={`notice${message.kind === 'error' ? ' notice--error' : ' notice--ok'}`}>{message.text}</p>
        )}

        <section class="section">
          <button class="btn btn--primary btn--block" onClick={downloadBackup} disabled={busy}>
            <Icon name="loan" size={18} />
            {t('data.export')}
          </button>
          <p class="hint">{t('data.export.hint')}</p>
        </section>

        <section class="section">
          <button class="btn btn--ghost btn--block" onClick={() => backupInput.current?.click()} disabled={busy}>
            {t('data.import')}
          </button>
          <input ref={backupInput} type="file" accept="application/json,.json" class="sr-only" onChange={onBackupFile} />
          <p class="hint">{t('data.import.hint')}</p>
        </section>

        <section class="section">
          <h2 class="section__title">{t('data.csv')}</h2>
          <button class="btn btn--ghost btn--block" onClick={() => csvInput.current?.click()} disabled={busy}>
            {t('data.csv')}
          </button>
          <input ref={csvInput} type="file" accept=".csv,text/csv,text/plain" class="sr-only" onChange={onCsvFile} />
          <p class="hint">{t('data.csv.hint')}</p>
        </section>

        <section class="section">
          <h2 class="section__title">{t('data.sheet')}</h2>
          <form class="field__row" onSubmit={onSheet}>
            <input
              class="input"
              type="url"
              inputMode="url"
              value={sheetUrl}
              placeholder={t('data.sheet.placeholder')}
              onInput={(e) => setSheetUrl((e.target as HTMLInputElement).value)}
            />
            <button class="btn btn--primary" type="submit" disabled={busy || !sheetUrl.trim()}>
              {t('data.fetch')}
            </button>
          </form>
          <p class="hint">{t('data.sheet.hint')}</p>
        </section>

        <section class="section">
          <button class="btn btn--danger btn--block" onClick={wipe} disabled={busy}>
            {t('data.danger')}
          </button>
          <p class="hint">{t('data.danger.hint')}</p>
        </section>
      </main>
    </>
  );
}
