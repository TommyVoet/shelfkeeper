import { TopBar } from '../components/TopBar';
import { Icon, type IconName } from '../components/Icon';
import { useT } from '../i18n';
import { ROUTES } from '../lib/routes';

const LINKS: { href: string; icon: IconName; key: string }[] = [
  { href: ROUTES.stats, icon: 'chart', key: 'stats.title' },
  { href: ROUTES.settings, icon: 'settings', key: 'settings.title' },
];

export function More() {
  const t = useT();
  return (
    <>
      <TopBar title={t('more.title')} />
      <main class="page">
        <ul class="rows">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a class="row" href={l.href}>
                <Icon name={l.icon} size={20} class="row__icon" />
                <span class="row__label">{t(l.key)}</span>
                <Icon name="chevron-right" size={18} class="row__chevron" />
              </a>
            </li>
          ))}
        </ul>

        <section class="card note">
          <h2 class="note__title">{t('about.privacy.title')}</h2>
          <p class="note__body">{t('about.privacy.body')}</p>
        </section>
      </main>
    </>
  );
}
