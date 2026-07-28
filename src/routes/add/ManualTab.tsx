import { useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { useT } from '../../i18n';
import { saveBook, useStore } from '../../lib/store';
import { cleanIsbn, isbnKey } from '../../lib/isbn';
import { lookupIsbn } from '../../lib/books/openlibrary';
import { cacheCover } from '../../lib/books/add';
import { bookPath } from '../../lib/routes';
import { BOOK_STATUSES, type BookStatus } from '../../lib/types';

interface Props {
  /** Vooraf ingevuld ISBN (komt van de scanner als een boek niet gevonden werd). */
  initialIsbn?: string;
}

export function ManualTab({ initialIsbn = '' }: Props) {
  const t = useT();
  const { route } = useLocation();
  const { shelves } = useStore();

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [isbn, setIsbn] = useState(initialIsbn);
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState('');
  const [pages, setPages] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<BookStatus>('owned');
  const [shelfIds, setShelfIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [coverId, setCoverId] = useState<number | undefined>(undefined);
  const [coverUrl, setCoverUrl] = useState<string | undefined>(undefined);

  /** ISBN opzoeken en de velden invullen die nog leeg zijn. */
  const lookup = async () => {
    const key = isbnKey(isbn);
    if (!key) {
      setError(t('add.manual.badIsbn'));
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const found = await lookupIsbn(key);
      if (!found) {
        setInfo(t('add.manual.lookupFailed'));
        return;
      }
      if (!title) setTitle(found.title);
      if (!authors) setAuthors(found.authors.join(' & '));
      if (!publisher && found.publisher) setPublisher(found.publisher);
      if (!year && found.year) setYear(String(found.year));
      if (!pages && found.pages) setPages(String(found.pages));
      setCoverId(found.coverId);
      setCoverUrl(found.coverUrl);
    } catch {
      setInfo(t('add.search.error'));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: Event) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t('add.manual.needTitle'));
      return;
    }
    const cleaned = cleanIsbn(isbn);
    if (cleaned && !isbnKey(cleaned)) {
      setError(t('add.manual.badIsbn'));
      return;
    }
    setBusy(true);
    try {
      const book = await saveBook({
        title: title.trim(),
        authors: authors.split(/\s*&\s*/).map((a) => a.trim()).filter(Boolean),
        isbn13: cleaned || undefined,
        publisher: publisher.trim() || undefined,
        year: year ? Number(year) : undefined,
        pages: pages ? Number(pages) : undefined,
        notes: notes.trim() || undefined,
        status,
        shelfIds,
        coverUrl,
        source: 'manual',
      });
      const key = await cacheCover(coverId, coverUrl);
      if (key) await saveBook({ id: book.id, title: book.title, coverKey: key });
      route(bookPath(book.id));
    } finally {
      setBusy(false);
    }
  };

  const toggleShelf = (id: string) =>
    setShelfIds((cur) => (cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id]));

  return (
    <form class="addtab" onSubmit={submit}>
      <label class="field">
        <span class="field__label">{t('add.manual.title')}</span>
        <input
          class="input"
          value={title}
          onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
          autocomplete="off"
          required
        />
      </label>

      <label class="field">
        <span class="field__label">{t('add.manual.authors')}</span>
        <input
          class="input"
          value={authors}
          onInput={(e) => setAuthors((e.target as HTMLInputElement).value)}
          autocomplete="off"
        />
        <span class="hint">{t('add.manual.authorsHint')}</span>
      </label>

      <div class="field">
        <span class="field__label">{t('add.manual.isbn')}</span>
        <div class="field__row">
          <input
            class="input"
            value={isbn}
            inputMode="numeric"
            onInput={(e) => setIsbn((e.target as HTMLInputElement).value)}
            autocomplete="off"
          />
          <button type="button" class="btn btn--ghost" onClick={lookup} disabled={busy || !isbn}>
            {t('add.manual.lookup')}
          </button>
        </div>
      </div>

      <div class="field field__grid">
        <label>
          <span class="field__label">{t('add.manual.year')}</span>
          <input
            class="input"
            value={year}
            inputMode="numeric"
            onInput={(e) => setYear((e.target as HTMLInputElement).value)}
          />
        </label>
        <label>
          <span class="field__label">{t('add.manual.pages')}</span>
          <input
            class="input"
            value={pages}
            inputMode="numeric"
            onInput={(e) => setPages((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <label class="field">
        <span class="field__label">{t('add.manual.publisher')}</span>
        <input
          class="input"
          value={publisher}
          onInput={(e) => setPublisher((e.target as HTMLInputElement).value)}
          autocomplete="off"
        />
      </label>

      <div class="field">
        <span class="field__label">{t('add.manual.status')}</span>
        <div class="chips">
          {BOOK_STATUSES.map((s) => (
            <button
              type="button"
              key={s}
              class={`chip${status === s ? ' is-active' : ''}`}
              onClick={() => setStatus(s)}
            >
              {t(`status.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {shelves.length > 0 && (
        <div class="field">
          <span class="field__label">{t('shelves.title')}</span>
          <div class="chips">
            {shelves.map((s) => (
              <button
                type="button"
                key={s.id}
                class={`chip${shelfIds.includes(s.id) ? ' is-active' : ''}`}
                onClick={() => toggleShelf(s.id)}
              >
                <span class="chip__dot" style={{ background: s.color }} />
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <label class="field">
        <span class="field__label">{t('add.manual.notes')}</span>
        <textarea
          class="input"
          value={notes}
          onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
        />
      </label>

      {error && <p class="notice notice--error">{error}</p>}
      {info && <p class="hint">{info}</p>}

      <button class="btn btn--primary btn--block" type="submit" disabled={busy}>
        {t('add.manual.save')}
      </button>
    </form>
  );
}
