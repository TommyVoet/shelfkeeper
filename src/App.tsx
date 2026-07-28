import { LocationProvider, Router, Route } from 'preact-iso';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { I18nContext, detectLocale, translate, type Locale, type Vars } from './i18n';
import { getLocalePref, setLocalePref, applyAppearance, getThemePref } from './lib/prefs';
import { BASE, ROUTES } from './lib/routes';
import { TabBar } from './components/TabBar';
import { Library } from './routes/Library';
import { Add } from './routes/Add';
import { Shelves } from './routes/Shelves';
import { Loans } from './routes/Loans';
import { More } from './routes/More';
import { Settings } from './routes/Settings';
import { Stats } from './routes/Stats';
import { NotFound } from './routes/NotFound';

export function App() {
  const [preference, setPreference] = useState<Locale | null>(() => getLocalePref());
  const [deviceLocale, setDeviceLocale] = useState<Locale>(() => detectLocale());
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

  return (
    <I18nContext.Provider value={i18n}>
      <LocationProvider scope={BASE || '/'}>
        <div class="app-shell">
          <Router>
            <Route path={ROUTES.library} component={Library} />
            <Route path={ROUTES.add} component={Add} />
            <Route path={ROUTES.shelves} component={Shelves} />
            <Route path={ROUTES.loans} component={Loans} />
            <Route path={ROUTES.more} component={More} />
            <Route path={ROUTES.stats} component={Stats} />
            <Route path={ROUTES.settings} component={Settings} />
            <Route default component={NotFound} />
          </Router>
        </div>
        <TabBar />
      </LocationProvider>
    </I18nContext.Provider>
  );
}
