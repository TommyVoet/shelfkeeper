/**
 * Voorkeuren voor het uiterlijk staan in localStorage, niet in IndexedDB:
 * ze moeten synchroon beschikbaar zijn vóór de eerste tekening van het scherm,
 * anders zie je heel even het verkeerde thema.
 */
import type { Locale } from '../i18n';
import { LOCALES } from '../i18n';

export type ThemePref = 'system' | 'light' | 'dark';
export const ACCENTS = ['green', 'indigo', 'terracotta', 'plum', 'teal', 'pink'] as const;
export type Accent = (typeof ACCENTS)[number];

const KEY = {
  theme: 'sk_theme',
  accent: 'sk_accent',
  locale: 'sk_locale',
} as const;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* privémodus zonder opslag: voorkeuren gelden dan alleen deze sessie */
  }
}

export function getThemePref(): ThemePref {
  const v = read(KEY.theme);
  return v === 'light' || v === 'dark' ? v : 'system';
}
export function setThemePref(v: ThemePref): void {
  write(KEY.theme, v === 'system' ? null : v);
}

export function getAccent(): Accent {
  const v = read(KEY.accent);
  return (ACCENTS as readonly string[]).includes(v ?? '') ? (v as Accent) : 'green';
}
export function setAccent(v: Accent): void {
  write(KEY.accent, v === 'green' ? null : v);
}

/** null = volg de taal van het toestel */
export function getLocalePref(): Locale | null {
  const v = read(KEY.locale);
  return (LOCALES as readonly string[]).includes(v ?? '') ? (v as Locale) : null;
}
export function setLocalePref(v: Locale | null): void {
  write(KEY.locale, v);
}

/** Zet thema en accent op <html>; ook aangeroepen door het opstartscript in index.html. */
export function applyAppearance(): void {
  const pref = getThemePref();
  const dark =
    pref === 'dark' ||
    (pref === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.accent = getAccent();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', dark ? '#131211' : '#f7f5f2');
  }
}
