import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from './lib/locales';

// Re-export locale constants from lib/locales.ts
// This allows middleware.ts to import locales without pulling in async imports
export { locales, defaultLocale, type Locale } from './lib/locales';

export default getRequestConfig(async ({ requestLocale, locale }) => {
  // next-intl 4.x: requestLocale comes from the [locale] URL segment (Promise),
  // locale is only set when explicitly passed to server functions like
  // getTranslations({locale: 'fr-CA'}). Prefer locale override, then
  // await requestLocale from the middleware/URL segment.
  const requested = locale ?? (await requestLocale);
  const validLocale = requested && locales.includes(requested as Locale) ? requested : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default,
    timeZone: 'America/Toronto', // Eastern Time (CLC headquarters in Ottawa)
    now: new Date()
  };
});
