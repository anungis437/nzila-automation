// i18n Configuration for UnionEyes
// Supports Canadian English (en-CA) and Canadian French (fr-CA) for the Canadian market

export const locales = ['en-CA', 'fr-CA'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en-CA';

export const localeNames: Record<Locale, string> = {
  'en-CA': 'English (Canada)',
  'fr-CA': 'Français (Canada)',
};

export const localeFlags: Record<Locale, string> = {
  'en-CA': '🇨🇦', // Canadian English
  'fr-CA': '🇨🇦', // Canadian French (Quebec)
};

// Fallback mapping - base locale falls back to CA variant
export const localeFallbacks: Record<Locale, Locale> = {
  'en-CA': 'en-CA',
  'fr-CA': 'fr-CA',
};

