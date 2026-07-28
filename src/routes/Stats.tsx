import { TopBar } from '../components/TopBar';
import { useT } from '../i18n';
import { ROUTES } from '../lib/routes';

export function Stats() {
  const t = useT();
  return (
    <>
      <TopBar title={t('stats.title')} back={ROUTES.more} />
      <main class="page">
        <div class="empty">
          <p>…</p>
        </div>
      </main>
    </>
  );
}
