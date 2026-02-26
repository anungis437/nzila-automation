/**
 * Zonga platform locales.
 *
 * International locales are listed first (with regions where relevant),
 * followed by major African language locales. The UI falls back to 'en'
 * when a specific regional variant isn't available.
 */
export const locales = [
  // ── International ──
  'en',
  'en-CA',
  'fr',
  'fr-CA',
  'pt',
  'es',
  'ar',

  // ── East Africa ──
  'sw',    // Swahili
  'am',    // Amharic

  // ── West Africa ──
  'yo',    // Yoruba
  'ha',    // Hausa
  'ig',    // Igbo
  'wo',    // Wolof
  'tw',    // Twi/Akan

  // ── Southern Africa ──
  'zu',    // Zulu
  'xh',    // Xhosa

  // ── Central Africa ──
  'ln',    // Lingala

  // ── Other ──
  'rw',    // Kinyarwanda
  'so',    // Somali
  'ti',    // Tigrinya
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

/**
 * Human-readable display labels for each locale.
 * Used in the language switcher and creator profile settings.
 */
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  'en-CA': 'English (Canada)',
  fr: 'Français',
  'fr-CA': 'Français (Canada)',
  pt: 'Português',
  es: 'Español',
  ar: 'العربية',
  sw: 'Kiswahili',
  am: 'አማርኛ',
  yo: 'Yorùbá',
  ha: 'Hausa',
  ig: 'Igbo',
  wo: 'Wolof',
  tw: 'Twi',
  zu: 'isiZulu',
  xh: 'isiXhosa',
  ln: 'Lingála',
  rw: 'Ikinyarwanda',
  so: 'Soomaali',
  ti: 'ትግርኛ',
};

/**
 * Resolve display direction for a locale.
 * Arabic is RTL; everything else is LTR.
 */
export function getDir(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
