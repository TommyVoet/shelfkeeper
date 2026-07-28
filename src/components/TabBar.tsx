import { useLocation } from 'preact-iso';
import { Icon, type IconName } from './Icon';
import { ROUTES } from '../lib/routes';
import { useT } from '../i18n';

interface Tab {
  href: string;
  icon: IconName;
  label: string;
}

export function TabBar() {
  const t = useT();
  const { path, route } = useLocation();

  const left: Tab[] = [
    { href: ROUTES.library, icon: 'library', label: t('nav.library') },
    { href: ROUTES.shelves, icon: 'shelves', label: t('nav.shelves') },
  ];
  const right: Tab[] = [
    { href: ROUTES.loans, icon: 'loan', label: t('nav.loans') },
    { href: ROUTES.more, icon: 'more', label: t('nav.more') },
  ];

  const item = (tab: Tab) => {
    const current = path === tab.href || (tab.href !== ROUTES.library && path.startsWith(tab.href));
    return (
      <a
        key={tab.href}
        href={tab.href}
        class="tabbar__item"
        aria-current={current ? 'page' : undefined}
      >
        <Icon name={tab.icon} />
        <span>{tab.label}</span>
      </a>
    );
  };

  return (
    <nav class="tabbar" aria-label={t('nav.library')}>
      {left.map(item)}
      <button
        class="tabbar__add"
        onClick={() => route(ROUTES.add)}
        aria-label={t('nav.add')}
      >
        <Icon name="plus" />
      </button>
      {right.map(item)}
    </nav>
  );
}
