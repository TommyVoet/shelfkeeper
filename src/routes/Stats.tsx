import { useMemo } from 'preact/hooks';
import { TopBar } from '../components/TopBar';
import { useI18n, useT } from '../i18n';
import { useStore } from '../lib/store';
import { computeStats } from '../lib/stats';
import { ROUTES } from '../lib/routes';

export function Stats() {
  const t = useT();
  const { locale } = useI18n();
  const { books } = useStore();
  const stats = useMemo(() => computeStats(books), [books]);
  const nf = new Intl.NumberFormat(locale);

  if (!books.length) {
    return (
      <>
        <TopBar title={t('stats.title')} back={ROUTES.more} />
        <main class="page">
          <div class="empty">
            <div class="empty__art" aria-hidden="true">📈</div>
            <p>{t('stats.empty')}</p>
          </div>
        </main>
      </>
    );
  }

  const tiles: [number, string][] = [
    [stats.total, t('stats.books')],
    [stats.authors, t('stats.authors')],
  ];
  if (stats.pages) tiles.push([stats.pages, t('stats.pages')]);
  if (stats.read) tiles.push([stats.read, t('stats.readCount')]);

  return (
    <>
      <TopBar title={t('stats.title')} back={ROUTES.more} />
      <main class="page">
        <div class="tiles">
          {tiles.map(([value, label]) => (
            <div class="tile" key={label}>
              <div class="tile__num">{nf.format(value)}</div>
              <div class="tile__label">{label}</div>
            </div>
          ))}
        </div>

        {stats.topAuthors.length > 0 && (
          <section class="section">
            <h2 class="section__title">{t('stats.topAuthors')}</h2>
            <ul class="rows">
              {stats.topAuthors.map((a) => (
                <li key={a.name}>
                  <a class="row" href={`${ROUTES.library}?q=${encodeURIComponent(a.name)}`}>
                    <span class="row__label">{a.name}</span>
                    <span class="row__value tile__count">{a.count}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section class="section">
          <h2 class="section__title">
            {t('stats.duplicates')}
            {stats.duplicates.length > 0 && ` (${stats.duplicates.length})`}
          </h2>
          {stats.duplicates.length === 0 ? (
            <p class="hint">{t('stats.noDuplicates')}</p>
          ) : (
            <ul class="rows">
              {stats.duplicates.slice(0, 30).map((d) => (
                <li key={d.ids[0]}>
                  <a class="row" href={`${ROUTES.library}?q=${encodeURIComponent(d.title)}`}>
                    <span class="row__label">
                      {d.title}
                      {d.author && <span class="row__sub"> — {d.author}</span>}
                    </span>
                    <span class="row__value tile__count">{t('stats.times', { count: d.count })}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
