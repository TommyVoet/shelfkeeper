import { Component, type ComponentChildren } from 'preact';
import { translate, type Locale } from '../i18n';

interface Props {
  locale: Locale;
  children: ComponentChildren;
}

interface State {
  failed: boolean;
}

/**
 * Vangt een fout in een scherm op, zodat de app niet als wit vlak achterblijft.
 * De boeken staan in IndexedDB en gaan hierdoor nooit verloren.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    console.error('[app]', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const t = (key: string) => translate(this.props.locale, key);
    return (
      <main class="page">
        <div class="empty">
          <div class="empty__art" aria-hidden="true">🙈</div>
          <p class="empty__title">{t('error.title')}</p>
          <p>{t('error.body')}</p>
          <button class="btn btn--primary" onClick={() => location.reload()}>
            {t('error.reload')}
          </button>
        </div>
      </main>
    );
  }
}
