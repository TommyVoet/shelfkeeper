import { useEffect, useRef, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { Icon } from '../../components/Icon';
import { useT } from '../../i18n';
import { searchBooks, type BookCandidate } from '../../lib/books/openlibrary';
import { addCandidate, findExisting } from '../../lib/books/add';
import { useStore } from '../../lib/store';
import { authorLine } from '../../lib/book';
import { bookPath } from '../../lib/routes';
import { CandidateRow } from './CandidateRow';

const DEBOUNCE_MS = 350;

export function SearchTab() {
  const t = useT();
  const { route } = useLocation();
  useStore(); // opnieuw tekenen zodra de collectie verandert ("heb je al")

  const [q, setQ] = useState('');
  const [results, setResults] = useState<BookCandidate[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Pas zoeken als iemand klaar is met typen; een vorige aanvraag wordt afgebroken.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      setBusy(false);
      setError(false);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      setError(false);
      try {
        setResults(await searchBooks(term, { signal: ctrl.signal }));
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setResults(null);
          setError(true);
        }
      } finally {
        if (!ctrl.signal.aborted) setBusy(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  const onAdd = async (c: BookCandidate) => {
    const book = await addCandidate(c, { source: 'search' });
    setAddedId(book.id);
  };

  return (
    <div class="addtab">
      <div class="searchbox">
        <Icon name="search" size={20} class="searchbox__icon" />
        <input
          ref={inputRef}
          class="input searchbox__input"
          type="search"
          value={q}
          placeholder={t('add.search.placeholder')}
          autocomplete="off"
          autocapitalize="off"
          onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        />
        {q && (
          <button class="searchbox__clear" aria-label={t('common.clear')} onClick={() => setQ('')}>
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      {addedId && (
        <div class="flash" role="status">
          <Icon name="check" size={18} />
          <span>{t('add.added')}</span>
          <button class="flash__btn" onClick={() => route(bookPath(addedId))}>
            {t('add.openBook')}
          </button>
        </div>
      )}

      {busy && <p class="hint">{t('add.search.searching')}</p>}
      {error && <p class="notice notice--error">{t('add.search.error')}</p>}
      {!busy && !error && results?.length === 0 && (
        <p class="hint">{t('add.search.noResults')}</p>
      )}
      {!busy && !error && results === null && <p class="hint">{t('add.search.hint')}</p>}

      {results && results.length > 0 && (
        <ul class="candidates">
          {results.map((c, i) => {
            const existing = findExisting(c);
            return (
              <CandidateRow
                key={`${c.olKey ?? c.title}-${i}`}
                candidate={c}
                subtitle={[authorLine(c.authors), c.year ? String(c.year) : ''].filter(Boolean).join(' · ')}
                existing={existing}
                onAdd={() => onAdd(c)}
                onOpen={() => existing && route(bookPath(existing.id))}
              />
            );
          })}
        </ul>
      )}

      <p class="byline">{t('add.byline')}</p>
    </div>
  );
}
