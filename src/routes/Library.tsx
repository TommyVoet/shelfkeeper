import { useLocation } from 'preact-iso';
import { TopBar } from '../components/TopBar';
import { useT } from '../i18n';
import { ROUTES } from '../lib/routes';

export function Library() {
  const t = useT();
  const { route } = useLocation();

  return (
    <>
      <TopBar title={t('library.title')} />
      <main class="page">
        <div class="empty">
          <div class="empty__art" aria-hidden="true">
            📚
          </div>
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
