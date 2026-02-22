'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function CreateAwardDialog() {
  const t = useTranslations('rewards.admin.awards.create');

  return (
    <Button disabled>
      <Plus className="mr-2 h-4 w-4" />
      {t('button', { defaultValue: 'Create Award' })}
    </Button>
  );
}

