import { TopBar } from '../components/TopBar';
import { useT } from '../i18n';

export function Loans() {
  const t = useT();
  return (
    <>
      <TopBar title={t('loans.title')} />
      <main class="page">
        <div class="empty">
          <p>…</p>
        </div>
      </main>
    </>
  );
}
