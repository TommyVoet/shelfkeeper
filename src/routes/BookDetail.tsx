import { useLocation, useRoute } from 'preact-iso';
import { TopBar } from '../components/TopBar';
import { BookCover } from '../components/BookCover';
import { useT } from '../i18n';
import { useStore } from '../lib/store';
import { authorLine } from '../lib/book';
import { ROUTES } from '../lib/routes';

export function BookDetail() {
  const t = useT();
  const { params } = useRoute();
  const { route } = useLocation();
  const { books, ready } = useStore();
  const book = books.find((b) => b.id === params.id);

  if (!book) {
    return (
      <>
        <TopBar title={t('app.name')} back={ROUTES.library} />
        <main class="page">
          <div class="empty">
            <p>{ready ? t('book.notFound') : t('common.loading')}</p>
            {ready && (
              <button class="btn btn--ghost" onClick={() => route(ROUTES.library)}>
                {t('nav.library')}
              </button>
            )}
          </div>
        </main>
      </>
    );
  }

  const facts: [string, string][] = [];
  if (book.publisher) facts.push([t('book.publisher'), book.publisher]);
  if (book.year) facts.push([t('book.year'), String(book.year)]);
  if (book.pages) facts.push([t('book.pages'), String(book.pages)]);
  if (book.isbn13) facts.push(['ISBN', book.isbn13]);

  return (
    <>
      <TopBar title={t('book.title')} back={ROUTES.library} />
      <main class="page">
        <div class="detail__head">
          <BookCover book={book} size="detail" />
          <div class="detail__meta">
            <h2 class="detail__title">{book.title}</h2>
            {book.subtitle && <p class="detail__subtitle">{book.subtitle}</p>}
            {book.authors.length > 0 && <p class="detail__author">{authorLine(book.authors)}</p>}
            <span class={`badge badge--${book.status}`}>{t(`status.${book.status}`)}</span>
          </div>
        </div>

        {book.originalTitle && (
          <p class="detail__note">
            {t('book.originalTitle')}: {book.originalTitle}
          </p>
        )}
        {book.notes && <p class="detail__note">{book.notes}</p>}

        {facts.length > 0 && (
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
        )}
      </main>
    </>
  );
}
