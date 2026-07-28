import { useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { TopBar } from '../components/TopBar';
import { Icon, type IconName } from '../components/Icon';
import { useT } from '../i18n';
import { ROUTES } from '../lib/routes';
import { SearchTab } from './add/SearchTab';
import { ManualTab } from './add/ManualTab';

type Mode = 'scan' | 'search' | 'manual';

const MODES: { id: Mode; icon: IconName; key: string }[] = [
  { id: 'scan', icon: 'scan', key: 'add.tab.scan' },
  { id: 'search', icon: 'search', key: 'add.tab.search' },
  { id: 'manual', icon: 'keyboard', key: 'add.tab.manual' },
];

export function Add() {
  const t = useT();
  const { query } = useLocation();
  // De scanner stuurt hierheen als een gescand boek niet gevonden is.
  const [mode, setMode] = useState<Mode>((query.mode as Mode) || 'search');

  return (
    <>
      <TopBar title={t('add.title')} back={ROUTES.library} />
      <main class="page">
        <div class="segmented" role="tablist">
          {MODES.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={mode === m.id}
              class={`segmented__item${mode === m.id ? ' is-active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              <Icon name={m.icon} size={18} />
              <span>{t(m.key)}</span>
            </button>
          ))}
        </div>

        {mode === 'search' && <SearchTab />}
        {mode === 'manual' && <ManualTab initialIsbn={query.isbn ?? ''} />}
        {mode === 'scan' && (
          <div class="empty">
            <div class="empty__art" aria-hidden="true">📷</div>
            <p>…</p>
          </div>
        )}
      </main>
    </>
  );
}
