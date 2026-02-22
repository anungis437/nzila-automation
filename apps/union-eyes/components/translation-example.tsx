'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

/**
 * Example component demonstrating translation usage
 * This can be used as a reference for translating other components
 */
export function TranslationExample() {
  const t = useTranslations('common');
  const nav = useTranslations('navigation');

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">{t('appName')}</h1>
      
      <div className="space-y-2">
        <p>{t('loading')}</p>
        
        <div className="flex gap-2">
          <Button>{t('save')}</Button>
          <Button variant="outline">{t('cancel')}</Button>
          <Button variant="destructive">{t('delete')}</Button>
        </div>
      </div>

      <nav className="space-y-1">
        <div>{nav('dashboard')}</div>
        <div>{nav('claims')}</div>
        <div>{nav('members')}</div>
        <div>{nav('settings')}</div>
      </nav>
    </div>
  );
}

