import { useState } from 'preact/hooks';
import { TopBar } from '../components/TopBar';
import { Icon } from '../components/Icon';
import { LOCALES, LOCALE_NAMES, useI18n, type Locale } from '../i18n';
import {
  ACCENTS,
  applyAppearance,
  getAccent,
  getThemePref,
  setAccent,
  setThemePref,
  type Accent,
  type ThemePref,
} from '../lib/prefs';
import { ROUTES } from '../lib/routes';

const THEMES: ThemePref[] = ['system', 'light', 'dark'];

export function Settings() {
  const { t, preference, setLocale } = useI18n();
  const [theme, setTheme] = useState<ThemePref>(() => getThemePref());
  const [accent, setAccentState] = useState<Accent>(() => getAccent());

  const chooseTheme = (v: ThemePref) => {
    setThemePref(v);
    setTheme(v);
    applyAppearance();
  };

  const chooseAccent = (v: Accent) => {
    setAccent(v);
    setAccentState(v);
    applyAppearance();
  };

  return (
    <>
      <TopBar title={t('settings.title')} back={ROUTES.more} />
      <main class="page">
        <section class="section">
          <h2 class="section__title">{t('settings.appearance')}</h2>

          <div class="field">
            <span class="field__label">{t('settings.theme')}</span>
            <div class="segmented">
              {THEMES.map((v) => (
                <button
                  key={v}
                  class={`segmented__item${theme === v ? ' is-active' : ''}`}
                  aria-pressed={theme === v}
                  onClick={() => chooseTheme(v)}
                >
                  {t(`settings.theme.${v}`)}
                </button>
              ))}
            </div>
          </div>

          <div class="field">
            <span class="field__label">{t('settings.accent')}</span>
            <div class="swatches">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  class={`swatch swatch--${a}${accent === a ? ' is-active' : ''}`}
                  aria-label={t(`settings.accent.${a}`)}
                  aria-pressed={accent === a}
                  onClick={() => chooseAccent(a)}
                >
                  {accent === a && <Icon name="check" size={18} />}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section class="section">
          <h2 class="section__title">{t('settings.language')}</h2>
          <ul class="rows">
            <li>
              <button
                class="row"
                onClick={() => setLocale(null)}
                aria-pressed={preference === null}
              >
                <span class="row__label">{t('settings.language.system')}</span>
                {preference === null && <Icon name="check" size={18} class="row__check" />}
              </button>
            </li>
            {LOCALES.map((l: Locale) => (
              <li key={l}>
                <button
                  class="row"
                  onClick={() => setLocale(l)}
                  aria-pressed={preference === l}
                  lang={l}
                >
                  <span class="row__label">{LOCALE_NAMES[l]}</span>
                  {preference === l && <Icon name="check" size={18} class="row__check" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
