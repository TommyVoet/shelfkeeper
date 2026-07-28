import { TopBar } from '../components/TopBar';
import { useT } from '../i18n';

export function Shelves() {
  const t = useT();
  return (
    <>
      <TopBar title={t('shelves.title')} />
      <main class="page">
        <div class="empty">
          <p>…</p>
        </div>
      </main>
    </>
  );
}
