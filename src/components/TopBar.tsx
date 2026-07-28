import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { Icon } from './Icon';
import { useT } from '../i18n';

interface Props {
  title: string;
  /** Toon een terugknop; met een pad gaat hij daarheen, zonder pad één stap terug. */
  back?: boolean | string;
  actions?: ComponentChildren;
}

export function TopBar({ title, back, actions }: Props) {
  const t = useT();
  const { route } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header class={`topbar${scrolled ? ' topbar--scrolled' : ''}`}>
      {back && (
        <button
          class="topbar__action"
          aria-label={t('common.back')}
          onClick={() => (typeof back === 'string' ? route(back) : history.back())}
        >
          <Icon name="back" />
        </button>
      )}
      <h1 class="topbar__title">{title}</h1>
      {actions}
    </header>
  );
}
