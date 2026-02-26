import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale, defaultLocale } from './config';

export default getRequestConfig(async ({ locale }) => {
  const validLocale = (locales.includes(locale as Locale) ? locale : defaultLocale) as Locale;

  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default,
    timeZone: 'America/Toronto',
  };
});
