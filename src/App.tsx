import { LocationProvider, Router, Route } from 'preact-iso';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { I18nContext, detectLocale, translate, type Locale, type Vars } from './i18n';
import {
  applyAppearance,
  getLocalePref,
  getThemePref,
  isOnboarded,
  setLocalePref,
  setOnboarded,
} from './lib/prefs';
import { BASE, ROUTES } from './lib/routes';
import { TabBar } from './components/TabBar';
import { Welcome } from './components/Welcome';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Library } from './routes/Library';
import { BookDetail } from './routes/BookDetail';
import { Add } from './routes/Add';
import { Shelves } from './routes/Shelves';
import { Loans } from './routes/Loans';
import { More } from './routes/More';
import { Settings } from './routes/Settings';
import { Stats } from './routes/Stats';
import { Data } from './routes/Data';
import { NotFound } from './routes/NotFound';

export function App() {
  const [preference, setPreference] = useState<Locale | null>(() => getLocalePref());
  const [deviceLocale, setDeviceLocale] = useState<Locale>(() => detectLocale());
  const [onboarded, setOnboardedState] = useState(() => isOnboarded());
  const locale = preference ?? deviceLocale;

  const setLocale = useCallback((l: Locale | null) => {
    setLocalePref(l);
    setPreference(l);
    if (l === null) setDeviceLocale(detectLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Volg het systeemthema zolang de gebruiker niets anders koos.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (getThemePref() === 'system') applyAppearance();
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const i18n = useMemo(
    () => ({
      locale,
      preference,
      setLocale,
      t: (key: string, vars?: Vars) => translate(locale, key, vars),
    }),
    [locale, preference, setLocale],
  );

  if (!onboarded) {
    return (
      <I18nContext.Provider value={i18n}>
        <Welcome
          onDone={(startScanning) => {
            setOnboarded();
            setOnboardedState(true);
            if (startScanning) history.replaceState(null, '', ROUTES.add);
          }}
        />
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={i18n}>
      <LocationProvider scope={BASE || '/'}>
        <div class="app-shell">
          <ErrorBoundary locale={locale}>
            <Router>
              <Route path={ROUTES.library} component={Library} />
              <Route path={ROUTES.add} component={Add} />
              <Route path={ROUTES.book} component={BookDetail} />
              <Route path={ROUTES.shelves} component={Shelves} />
              <Route path={ROUTES.loans} component={Loans} />
              <Route path={ROUTES.more} component={More} />
              <Route path={ROUTES.stats} component={Stats} />
              <Route path={ROUTES.data} component={Data} />
              <Route path={ROUTES.settings} component={Settings} />
              <Route default component={NotFound} />
            </Router>
          </ErrorBoundary>
        </div>
        <TabBar />
      </LocationProvider>
    </I18nContext.Provider>
  );
}
