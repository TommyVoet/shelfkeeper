import { useState } from 'preact/hooks';
import { TopBar } from '../components/TopBar';
import { Icon, type IconName } from '../components/Icon';
import { useT } from '../i18n';
import { ROUTES } from '../lib/routes';

type Mode = 'scan' | 'search' | 'manual';

const MODES: { id: Mode; icon: IconName; key: string }[] = [
  { id: 'scan', icon: 'scan', key: 'add.tab.scan' },
  { id: 'search', icon: 'search', key: 'add.tab.search' },
  { id: 'manual', icon: 'keyboard', key: 'add.tab.manual' },
];

export function Add() {
  const t = useT();
  const [mode, setMode] = useState<Mode>('scan');

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
        <div class="empty">
          <p>…</p>
        </div>
      </main>
    </>
  );
}
