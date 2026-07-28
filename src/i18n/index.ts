import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import en from './en.json';
import nl from './nl.json';
import fr from './fr.json';

export const LOCALES = ['en', 'nl', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  nl: 'Nederlands',
  fr: 'Français',
};

type Dict = Record<string, string>;

const DICTS: Record<Locale, Dict> = {
  en: en as Dict,
  nl: nl as Dict,
  fr: fr as Dict,
};

export type Vars = Record<string, string | number>;
export type TFunc = (key: string, vars?: Vars) => string;

/** 'nl-BE' → 'nl'; onbekende taal → 'en'. */
export function resolveLocale(tag: string | undefined | null): Locale | null {
  if (!tag) return null;
  const base = tag.toLowerCase().split('-')[0];
  return (LOCALES as readonly string[]).includes(base) ? (base as Locale) : null;
}

/** Eerste taal van het toestel die we spreken, anders Engels. */
export function detectLocale(): Locale {
  const langs = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
  for (const l of langs) {
    const hit = resolveLocale(l);
    if (hit) return hit;
  }
  return 'en';
}

/**
 * Vertaalt een sleutel. Meervoud via Intl.PluralRules: geef `count` mee en de
 * sleutel wordt eerst met een achtervoegsel geprobeerd (`books_one`, `books_other`).
 * Ontbrekende vertalingen vallen terug op Engels, daarna op de sleutel zelf —
 * zo blijft de app bruikbaar terwijl een taal nog niet compleet is.
 */
export function translate(locale: Locale, key: string, vars?: Vars): string {
  const dict = DICTS[locale];
  let raw: string | undefined;

  if (vars && typeof vars.count === 'number') {
    const cat = new Intl.PluralRules(locale).select(vars.count);
    raw = dict[`${key}_${cat}`] ?? DICTS.en[`${key}_${cat}`] ?? dict[`${key}_other`] ?? DICTS.en[`${key}_other`];
  }
  raw ??= dict[key] ?? DICTS.en[key];
  if (raw === undefined) {
    if (import.meta.env?.DEV) console.warn(`[i18n] missing key: ${key}`);
    return key;
  }
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name: string) => {
    const v = vars[name];
    return v === undefined ? m : String(v);
  });
}

export interface I18n {
  locale: Locale;
  t: TFunc;
  /** null = volg de taal van het toestel */
  setLocale: (l: Locale | null) => void;
  preference: Locale | null;
}

export const I18nContext = createContext<I18n>({
  locale: 'en',
  t: (k) => translate('en', k),
  setLocale: () => {},
  preference: null,
});

export const useI18n = (): I18n => useContext(I18nContext);
/** Kortste vorm voor in componenten: `const t = useT()`. */
export const useT = (): TFunc => useContext(I18nContext).t;
