'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { locales, localeNames, type Locale } from '@/i18n/config';

export function LanguageToggle() {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: Locale) => {
    // Get the current pathname without the locale prefix
    const currentPath = pathname.replace(`/${locale}`, '');
    
    // Build the new path with the new locale
    const newPath = newLocale === 'en' 
      ? currentPath || '/'  // Don&apos;t add /en for default locale
      : `/${newLocale}${currentPath || '/'}`;
    
    // Navigate to the new path
    router.push(newPath);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-600" />
      <Select value={locale} onValueChange={(value) => handleLanguageChange(value as Locale)}>
        <SelectTrigger className="w-[140px] border-gray-300">
          <SelectValue placeholder={t('selectLanguage')} />
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {localeNames[loc]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

