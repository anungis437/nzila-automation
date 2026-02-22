'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';

interface WalletBalanceCardProps {
  balance: number;
}

export function WalletBalanceCard({ balance }: WalletBalanceCardProps) {
  const t = useTranslations('rewards.wallet');

  return (
    <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg">
              {t('balance.title', { defaultValue: 'Available Credits' })}
            </CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground">
                  <Info className="h-4 w-4" />
                  <span className="sr-only">
                    {t('balance.info', { defaultValue: 'Information about credits' })}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  {t('balance.tooltip', {
                    defaultValue:
                      'Credits are earned through recognition awards and can be redeemed for products and services via Shop Moi Ça.',
                  })}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-5xl font-bold tracking-tight text-primary" data-testid="reward-balance">
            {balance.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">
            {t('balance.subtitle', {
              defaultValue: 'credits ready to redeem',
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

