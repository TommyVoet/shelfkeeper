import { TopBar } from '../components/TopBar';
import { useT } from '../i18n';
import { ROUTES } from '../lib/routes';

export function NotFound() {
  const t = useT();
  return (
    <>
      <TopBar title={t('app.name')} />
      <main class="page">
        <div class="empty">
          <div class="empty__art" aria-hidden="true">
            🔖
          </div>
          <p class="empty__title">404</p>
          <a class="btn btn--ghost" href={ROUTES.library}>
            {t('nav.library')}
          </a>
        </div>
      </main>
    </>
  );
}
