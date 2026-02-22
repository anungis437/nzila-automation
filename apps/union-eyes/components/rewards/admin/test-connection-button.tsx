'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function TestConnectionButton() {
  const t = useTranslations('rewards.admin.shopify');
  const router = useRouter();
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    // Trigger page refresh to re-test connection
    router.refresh();
    setTimeout(() => setTesting(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleTest}
      disabled={testing}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
      {t('status.test', { defaultValue: 'Test Connection' })}
    </Button>
  );
}

