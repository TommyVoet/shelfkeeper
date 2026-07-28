import { useLocation } from 'preact-iso';
import { TopBar } from '../components/TopBar';
import { BookCover } from '../components/BookCover';
import { Icon } from '../components/Icon';
import { useI18n, useT } from '../i18n';
import { returnLoan, useStore } from '../lib/store';
import { bookPath } from '../lib/routes';
import type { Book, Loan } from '../lib/types';

export function Loans() {
  const t = useT();
  const { locale } = useI18n();
  const { loans, books } = useStore();
  const { route } = useLocation();

  const byId = new Map<string, Book>(books.map((b) => [b.id, b]));
  const open = loans.filter((l) => !l.returnedAt).sort((a, b) => a.lentAt - b.lentAt);
  const done = loans
    .filter((l) => l.returnedAt)
    .sort((a, b) => (b.returnedAt ?? 0) - (a.returnedAt ?? 0))
    .slice(0, 20);

  const fmt = (ms: number) =>
    new Date(ms).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });

  const row = (loan: Loan, returned: boolean) => {
    const book = byId.get(loan.bookId);
    if (!book) return null;
    const overdue = !returned && loan.dueAt !== undefined && loan.dueAt < Date.now();
    return (
      <li key={loan.id}>
        <div class={`loanrow${overdue ? ' is-overdue' : ''}`}>
          <button class="loanrow__book" onClick={() => route(bookPath(book.id))}>
            <BookCover book={book} size="row" />
            <span class="loanrow__text">
              <span class="loanrow__title">{book.title}</span>
              <span class="loanrow__person">{t('book.lentTo', { person: loan.person })}</span>
              <span class="loanrow__meta">
                {returned
                  ? t('loans.returnedOn', { date: fmt(loan.returnedAt!) })
                  : loan.dueAt
                    ? t('loans.due', { date: fmt(loan.dueAt) })
                    : t('book.lentSince', { date: fmt(loan.lentAt) })}
              </span>
            </span>
          </button>
          {overdue && <span class="badge badge--wishlist">{t('loans.overdue')}</span>}
          {!returned && (
            <button class="loanrow__btn" onClick={() => returnLoan(loan.id)} aria-label={t('book.return')}>
              <Icon name="check" size={20} />
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <>
      <TopBar title={t('loans.title')} />
      <main class="page">
        {open.length === 0 ? (
          <div class="empty">
            <div class="empty__art" aria-hidden="true">🤝</div>
            <p class="empty__title">{t('loans.empty.title')}</p>
            <p>{t('loans.empty.body')}</p>
          </div>
        ) : (
          <>
            <p class="hint">{t('loans.count', { count: open.length })}</p>
            <ul class="loanlist">{open.map((l) => row(l, false))}</ul>
          </>
        )}

        {done.length > 0 && (
          <section class="section">
            <h2 class="section__title">{t('loans.history')}</h2>
            <ul class="loanlist loanlist--done">{done.map((l) => row(l, true))}</ul>
          </section>
        )}
      </main>
    </>
  );
}
