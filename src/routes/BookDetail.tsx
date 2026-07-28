import { useEffect, useState } from 'preact/hooks';
import { useLocation, useRoute } from 'preact-iso';
import { TopBar } from '../components/TopBar';
import { BookCover } from '../components/BookCover';
import { Icon } from '../components/Icon';
import { Stars } from '../components/Stars';
import { useI18n, useT } from '../i18n';
import {
  createShelf,
  createTag,
  lendBook,
  openLoanFor,
  removeBook,
  returnLoan,
  saveBook,
  useStore,
} from '../lib/store';
import { authorLine } from '../lib/book';
import { cleanIsbn, isbnKey } from '../lib/isbn';
import { ROUTES, to } from '../lib/routes';
import { BOOK_STATUSES, type Book } from '../lib/types';

export function BookDetail() {
  const t = useT();
  const { locale } = useI18n();
  const { params } = useRoute();
  const { route } = useLocation();
  const { books, shelves, tags, loans, ready } = useStore();
  const book = books.find((b) => b.id === params.id);

  const [editing, setEditing] = useState(false);
  const [lending, setLending] = useState(false);
  const [notes, setNotes] = useState(book?.notes ?? '');

  // Bij het openen van een ander boek de notitie meenemen.
  useEffect(() => setNotes(book?.notes ?? ''), [book?.id]);

  if (!book) {
    return (
      <>
        <TopBar title={t('book.title')} back={ROUTES.library} />
        <main class="page">
          <div class="empty">
            <p>{ready ? t('book.notFound') : t('common.loading')}</p>
            {ready && (
              <a class="btn btn--ghost" href={ROUTES.library}>
                {t('nav.library')}
              </a>
            )}
          </div>
        </main>
      </>
    );
  }

  const loan = loans.find((l) => l.bookId === book.id && !l.returnedAt) ?? openLoanFor(book.id);
  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });

  const patch = (fields: Partial<Book>) => saveBook({ ...fields, id: book.id, title: book.title });

  const toggleShelf = (id: string) =>
    patch({
      shelfIds: book.shelfIds.includes(id)
        ? book.shelfIds.filter((s) => s !== id)
        : [...book.shelfIds, id],
    });

  const toggleTag = (id: string) =>
    patch({
      tagIds: book.tagIds.includes(id) ? book.tagIds.filter((s) => s !== id) : [...book.tagIds, id],
    });

  const newShelf = async () => {
    const name = prompt(t('shelves.name'));
    if (!name?.trim()) return;
    const shelf = await createShelf(name);
    await patch({ shelfIds: [...book.shelfIds, shelf.id] });
  };

  const newTag = async () => {
    const name = prompt(t('shelves.name'));
    if (!name?.trim()) return;
    const tag = await createTag(name);
    await patch({ tagIds: [...book.tagIds, tag.id] });
  };

  const doDelete = async () => {
    if (!confirm(t('book.deleteConfirm', { title: book.title }))) return;
    await removeBook(book.id);
    route(ROUTES.library);
  };

  const facts: [string, string][] = [];
  if (book.originalTitle) facts.push([t('book.originalTitle'), book.originalTitle]);
  if (book.series) facts.push([t('book.series'), book.series]);
  if (book.publisher) facts.push([t('book.publisher'), book.publisher]);
  if (book.year) facts.push([t('book.year'), String(book.year)]);
  if (book.pages) facts.push([t('book.pages'), String(book.pages)]);
  if (book.isbn13) facts.push(['ISBN', book.isbn13]);

  return (
    <>
      <TopBar
        title={t('book.title')}
        back={ROUTES.library}
        actions={
          <button
            class="topbar__action"
            aria-label={t(editing ? 'book.editDone' : 'book.edit')}
            onClick={() => setEditing(!editing)}
          >
            <Icon name={editing ? 'check' : 'edit'} />
          </button>
        }
      />
      <main class="page">
        <div class="detail__head">
          <BookCover book={book} size="detail" />
          <div class="detail__meta">
            <h2 class="detail__title">{book.title}</h2>
            {book.subtitle && <p class="detail__subtitle">{book.subtitle}</p>}
            {book.authors.length > 0 && (
              <a class="detail__author" href={`${ROUTES.library}?q=${encodeURIComponent(book.authors[0])}`}>
                {authorLine(book.authors)}
              </a>
            )}
            <Stars value={book.rating} onChange={(rating) => patch({ rating })} label={t('book.rating')} />
          </div>
        </div>

        {loan && (
          <div class="loanbanner">
            <Icon name="loan" size={20} />
            <div class="loanbanner__text">
              <strong>{t('book.lentTo', { person: loan.person })}</strong>
              <span>{t('book.lentSince', { date: fmtDate(loan.lentAt) })}</span>
            </div>
            <button class="btn btn--ghost" onClick={() => returnLoan(loan.id)}>
              {t('book.return')}
            </button>
          </div>
        )}

        <section class="section">
          <h3 class="section__title">{t('book.status')}</h3>
          <div class="chips">
            {BOOK_STATUSES.map((s) => (
              <button
                key={s}
                class={`chip${book.status === s ? ' is-active' : ''}`}
                onClick={() => patch({ status: s })}
              >
                {t(`status.${s}`)}
              </button>
            ))}
          </div>
        </section>

        <section class="section">
          <h3 class="section__title">{t('book.shelves')}</h3>
          <div class="chips">
            {shelves.map((s) => (
              <button
                key={s.id}
                class={`chip${book.shelfIds.includes(s.id) ? ' is-active' : ''}`}
                onClick={() => toggleShelf(s.id)}
              >
                <span class="chip__dot" style={{ background: s.color }} />
                {s.name}
              </button>
            ))}
            <button class="chip chip--add" onClick={newShelf}>
              <Icon name="plus" size={14} />
              {t('shelves.new')}
            </button>
          </div>
        </section>

        <section class="section">
          <h3 class="section__title">{t('book.tags')}</h3>
          <div class="chips">
            {tags.map((tg) => (
              <button
                key={tg.id}
                class={`chip${book.tagIds.includes(tg.id) ? ' is-active' : ''}`}
                onClick={() => toggleTag(tg.id)}
              >
                {tg.name}
              </button>
            ))}
            <button class="chip chip--add" onClick={newTag}>
              <Icon name="plus" size={14} />
              {t('tags.new')}
            </button>
          </div>
        </section>

        <section class="section">
          <h3 class="section__title">{t('book.notes')}</h3>
          <textarea
            class="input"
            value={notes}
            placeholder={t('book.notes.placeholder')}
            onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
            onBlur={(e) => {
              // Uit het veld zelf lezen, niet uit de toestand: bij snel tikken
              // en meteen wegklikken loopt die een tel achter.
              const value = (e.target as HTMLTextAreaElement).value;
              if (value !== (book.notes ?? '')) void patch({ notes: value });
            }}
          />
        </section>

        {editing ? (
          <EditFields book={book} onDone={() => setEditing(false)} />
        ) : (
          facts.length > 0 && (
            <ul class="rows">
              {facts.map(([label, value]) => (
                <li key={label}>
                  <div class="row">
                    <span class="row__label">{label}</span>
                    <span class="row__value">{value}</span>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {!loan && !lending && (
          <button class="btn btn--ghost btn--block detail__lend" onClick={() => setLending(true)}>
            <Icon name="loan" size={18} />
            {t('book.lend')}
          </button>
        )}

        {lending && !loan && (
          <LendForm
            onCancel={() => setLending(false)}
            onLend={async (person, dueAt) => {
              await lendBook(book.id, person, dueAt);
              setLending(false);
            }}
          />
        )}

        <button class="btn btn--danger btn--block detail__delete" onClick={doDelete}>
          {t('book.delete')}
        </button>
      </main>
    </>
  );
}

/* ---------------- gegevens aanpassen ---------------- */

function EditFields({ book, onDone }: { book: Book; onDone: () => void }) {
  const t = useT();
  const [title, setTitle] = useState(book.title);
  const [subtitle, setSubtitle] = useState(book.subtitle ?? '');
  const [authors, setAuthors] = useState(book.authors.join(' & '));
  const [originalTitle, setOriginalTitle] = useState(book.originalTitle ?? '');
  const [series, setSeries] = useState(book.series ?? '');
  const [publisher, setPublisher] = useState(book.publisher ?? '');
  const [year, setYear] = useState(book.year ? String(book.year) : '');
  const [pages, setPages] = useState(book.pages ? String(book.pages) : '');
  const [isbn, setIsbn] = useState(book.isbn13 ?? '');
  const [error, setError] = useState<string | null>(null);

  const save = async (e: Event) => {
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
    await saveBook({
      id: book.id,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      authors: authors.split(/\s*&\s*/).map((a) => a.trim()).filter(Boolean),
      originalTitle: originalTitle.trim() || undefined,
      series: series.trim() || undefined,
      publisher: publisher.trim() || undefined,
      year: year ? Number(year) : undefined,
      pages: pages ? Number(pages) : undefined,
      isbn13: cleaned || undefined,
    });
    onDone();
  };

  const field = (label: string, value: string, set: (v: string) => void, numeric = false) => (
    <label class="field">
      <span class="field__label">{label}</span>
      <input
        class="input"
        value={value}
        inputMode={numeric ? 'numeric' : undefined}
        onInput={(e) => set((e.target as HTMLInputElement).value)}
      />
    </label>
  );

  return (
    <form class="section" onSubmit={save}>
      {field(t('add.manual.title'), title, setTitle)}
      {field(t('book.subtitle'), subtitle, setSubtitle)}
      {field(t('add.manual.authors'), authors, setAuthors)}
      {field(t('book.originalTitle'), originalTitle, setOriginalTitle)}
      {field(t('book.series'), series, setSeries)}
      {field(t('add.manual.publisher'), publisher, setPublisher)}
      <div class="field__grid">
        {field(t('add.manual.year'), year, setYear, true)}
        {field(t('add.manual.pages'), pages, setPages, true)}
      </div>
      {field('ISBN', isbn, setIsbn, true)}
      {error && <p class="notice notice--error">{error}</p>}
      <div class="field__row">
        <button type="button" class="btn btn--ghost" onClick={onDone}>
          {t('common.cancel')}
        </button>
        <button type="submit" class="btn btn--primary">
          {t('common.save')}
        </button>
      </div>
    </form>
  );
}

/* ---------------- uitlenen ---------------- */

function LendForm({
  onLend,
  onCancel,
}: {
  onLend: (person: string, dueAt?: number) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useT();
  const [person, setPerson] = useState('');
  const [due, setDue] = useState('');

  return (
    <form
      class="section lendform"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!person.trim()) return;
        await onLend(person.trim(), due ? new Date(due).getTime() : undefined);
      }}
    >
      <label class="field">
        <span class="field__label">{t('book.lendPerson')}</span>
        <input
          class="input"
          value={person}
          autoFocus
          onInput={(e) => setPerson((e.target as HTMLInputElement).value)}
        />
      </label>
      <label class="field">
        <span class="field__label">{t('book.lendDue')}</span>
        <input
          class="input"
          type="date"
          value={due}
          onInput={(e) => setDue((e.target as HTMLInputElement).value)}
        />
      </label>
      <div class="field__row">
        <button type="button" class="btn btn--ghost" onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="submit" class="btn btn--primary" disabled={!person.trim()}>
          {t('book.lend')}
        </button>
      </div>
    </form>
  );
}

export const bookRoutePath = to('/book/:id');
