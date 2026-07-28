import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { BookCover } from '../components/BookCover';
import { Highlighted } from '../components/Highlighted';
import { useI18n, useT } from '../i18n';
import { useStore } from '../lib/store';
import { matchesTokens, tokenize } from '../lib/text';
import { firstLetterOf, presentLetters, sortBooks, type SortMode } from '../lib/sort';
import { authorLine } from '../lib/book';
import { getSortMode, getViewMode, setSortMode, setViewMode, type ViewMode } from '../lib/prefs';
import { ROUTES, bookPath } from '../lib/routes';
import type { Book, BookStatus } from '../lib/types';

/** Zoveel boeken tegelijk tekenen; de rest komt bij tijdens het scrollen. */
const CHUNK = 60;

const SORT_ORDER: SortMode[] = ['author', 'title', 'added'];

export function Library() {
  const t = useT();
  const { locale } = useI18n();
  const { books, shelves, tags, ready } = useStore();
  const { query: urlQuery, route } = useLocation();

  // De plank- en etiketschermen linken hierheen met ?shelf=… of ?tag=…
  const [q, setQ] = useState(urlQuery.q ?? '');
  const [sort, setSort] = useState<SortMode>(getSortMode);
  const [view, setView] = useState<ViewMode>(getViewMode);
  const [shelfId, setShelfId] = useState<string | null>(urlQuery.shelf ?? null);
  const [tagId, setTagId] = useState<string | null>(urlQuery.tag ?? null);
  const [status, setStatus] = useState<BookStatus | null>(null);
  const [visible, setVisible] = useState(CHUNK);
  const [pendingJump, setPendingJump] = useState<number | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const tokens = useMemo(() => tokenize(q), [q]);
  const filtering = tokens.length > 0 || shelfId !== null || tagId !== null || status !== null;

  const shown = useMemo(() => {
    let list = books;
    if (shelfId) list = list.filter((b) => b.shelfIds.includes(shelfId));
    if (tagId) list = list.filter((b) => b.tagIds.includes(tagId));
    if (status) list = list.filter((b) => b.status === status);
    if (tokens.length) list = list.filter((b) => matchesTokens(b.hay, tokens));
    return sortBooks(list, sort, locale);
  }, [books, shelfId, tagId, status, tokens, sort, locale]);

  const letters = useMemo(
    () => (filtering || sort === 'added' ? [] : presentLetters(shown, sort)),
    [shown, sort, filtering],
  );

  // Statusknoppen alleen tonen als er ook echt zulke boeken zijn.
  const otherStatuses = useMemo(() => {
    const present = new Set(books.map((b) => b.status));
    return (['reading', 'wishlist', 'read'] as BookStatus[]).filter((s) => present.has(s));
  }, [books]);

  // Bij een nieuwe zoekopdracht weer bovenaan beginnen.
  useEffect(() => setVisible(CHUNK), [q, shelfId, tagId, status, sort]);

  // Meer boeken tekenen zodra het einde van de lijst in zicht komt.
  // Bewust met een scroll-luisteraar en niet met IntersectionObserver: die
  // levert geen meldingen als het venster niet tekent (achtergrondtabblad).
  useEffect(() => {
    if (visible >= shown.length) return;
    const check = () => {
      const el = sentinel.current;
      if (!el) return;
      if (el.getBoundingClientRect().top < window.innerHeight + 800) {
        setVisible((v) => (v >= shown.length ? v : v + CHUNK));
      }
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [shown.length, visible]);

  const cycleSort = () => {
    const next = SORT_ORDER[(SORT_ORDER.indexOf(sort) + 1) % SORT_ORDER.length];
    setSort(next);
    setSortMode(next);
  };

  const toggleView = () => {
    const next: ViewMode = view === 'grid' ? 'list' : 'grid';
    setView(next);
    setViewMode(next);
  };

  const jumpTo = (letter: string) => {
    const i = shown.findIndex((b) => firstLetterOf(b, sort) === letter);
    if (i < 0) return;
    if (i >= visible) setVisible(i + CHUNK);
    setPendingJump(i);
  };

  // Pas scrollen nadat de rij ook echt getekend is (na een sprong naar het eind
  // van de lijst moeten er eerst honderden boeken bij).
  useEffect(() => {
    if (pendingJump === null) return;
    const el = listRef.current?.children[pendingJump] as HTMLElement | undefined;
    if (el) {
      const head = document.querySelector('.topbar')?.getBoundingClientRect().height ?? 0;
      const bar = document.querySelector('.searchwrap')?.getBoundingClientRect().height ?? 0;
      // Geen 'smooth': dat werd op sommige toestellen genegeerd (les uit Boekenzoeker).
      window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY - head - bar - 8));
    }
    setPendingJump(null);
  }, [pendingJump, visible]);

  const openBook = (b: Book) => route(bookPath(b.id));

  if (ready && books.length === 0) {
    return (
      <>
        <TopBar title={t('library.title')} />
        <main class="page">
          <div class="empty">
            <div class="empty__art" aria-hidden="true">📚</div>
            <p class="empty__title">{t('library.empty.title')}</p>
            <p>{t('library.empty.body')}</p>
            <button class="btn btn--primary" onClick={() => route(ROUTES.add)}>
              {t('library.empty.cta')}
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar
        title={t('library.title')}
        actions={
          <button class="topbar__action" onClick={toggleView} aria-label={t(`library.view.${view === 'grid' ? 'list' : 'grid'}`)}>
            <Icon name={view === 'grid' ? 'list' : 'grid'} />
          </button>
        }
      />
      <main class="page">
        <div class="searchwrap">
          <div class="searchbox">
            <Icon name="search" size={20} class="searchbox__icon" />
            <input
              class="input searchbox__input"
              type="search"
              value={q}
              placeholder={t('library.search.placeholder')}
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

          {(shelves.length > 0 || otherStatuses.length > 0 || tagId !== null) && (
            <div class="chips" role="group">
              <button
                class={`chip${shelfId === null && status === null && tagId === null ? ' is-active' : ''}`}
                onClick={() => {
                  setShelfId(null);
                  setStatus(null);
                  setTagId(null);
                }}
              >
                {t('library.filter.all')}
              </button>
              {tagId && (
                <button class="chip is-active" onClick={() => setTagId(null)}>
                  {tags.find((x) => x.id === tagId)?.name ?? t('tags.title')}
                </button>
              )}
              {shelves.map((s) => (
                <button
                  key={s.id}
                  class={`chip${shelfId === s.id ? ' is-active' : ''}`}
                  onClick={() => setShelfId(shelfId === s.id ? null : s.id)}
                >
                  <span class="chip__dot" style={{ background: s.color }} />
                  {s.name}
                </button>
              ))}
              {otherStatuses.map((s) => (
                <button
                  key={s}
                  class={`chip${status === s ? ' is-active' : ''}`}
                  onClick={() => setStatus(status === s ? null : s)}
                >
                  {t(`status.${s}`)}
                </button>
              ))}
            </div>
          )}

          <div class="statusline">
            <span class="statusline__count">
              {filtering
                ? t('library.countFiltered', { shown: shown.length, total: books.length })
                : t('common.books', { count: books.length })}
            </span>
            <button class="statusline__btn" onClick={cycleSort}>
              <Icon name="sort" size={16} />
              {t(`library.sort.${sort}`)}
            </button>
          </div>

          {letters.length > 1 && (
            <div class="azbar" aria-label={t('library.jump')}>
              {letters.map((l) => (
                <button key={l} onClick={() => jumpTo(l)}>
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>

        {shown.length === 0 ? (
          <div class="empty">
            <div class="empty__art" aria-hidden="true">🔎</div>
            <p class="empty__title">{t('library.noResults.title')}</p>
            <p>{t('library.noResults.body')}</p>
            <button class="btn btn--ghost" onClick={() => route(ROUTES.add)}>
              {t('library.noResults.cta')}
            </button>
          </div>
        ) : view === 'grid' ? (
          <ul class="bookgrid" ref={listRef}>
            {shown.slice(0, visible).map((b) => (
              <li key={b.id}>
                <button class="bookgrid__item" onClick={() => openBook(b)}>
                  <BookCover book={b} />
                  <span class="bookgrid__title">
                    <Highlighted text={b.title} tokens={tokens} />
                  </span>
                  <span class="bookgrid__author">
                    <Highlighted text={authorLine(b.authors)} tokens={tokens} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul class="booklist" ref={listRef}>
            {shown.slice(0, visible).map((b) => (
              <li key={b.id}>
                <button class="booklist__item" onClick={() => openBook(b)}>
                  <BookCover book={b} size="row" />
                  <span class="booklist__text">
                    <span class="booklist__title">
                      <Highlighted text={b.title} tokens={tokens} />
                    </span>
                    <span class="booklist__author">
                      <Highlighted
                        text={sort === 'author' && b.authorSort ? b.authorSort : authorLine(b.authors)}
                        tokens={tokens}
                      />
                    </span>
                    {b.status !== 'owned' && (
                      <span class={`badge badge--${b.status}`}>{t(`status.${b.status}`)}</span>
                    )}
                  </span>
                  <Icon name="chevron-right" size={18} class="booklist__chevron" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div class="scroll-sentinel" ref={sentinel} aria-hidden="true" />
      </main>
    </>
  );
}
