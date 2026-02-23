'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Gift } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RecognitionAward } from '@/db/schema/recognition-rewards-schema';

interface AwardsQueueProps {
  awards: RecognitionAward[];
  status: 'pending_approval' | 'approved' | 'issued';
}

export function AwardsQueue({ awards, status }: AwardsQueueProps) {
  const t = useTranslations('rewards.admin.awards');

  if (awards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('queue.empty', { defaultValue: 'No awards in this status' })}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('queue.columns.recipient', { defaultValue: 'Recipient' })}</TableHead>
            <TableHead>{t('queue.columns.award', { defaultValue: 'Award Type' })}</TableHead>
            <TableHead>{t('queue.columns.credits', { defaultValue: 'Credits' })}</TableHead>
            <TableHead>{t('queue.columns.date', { defaultValue: 'Date' })}</TableHead>
            <TableHead className="text-right">{t('queue.columns.actions', { defaultValue: 'Actions' })}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {awards.map((award) => (
            <TableRow key={award.id}>
              <TableCell className="font-medium">{award.recipient_user_id}</TableCell>
              <TableCell>{award.award_type_id}</TableCell>
              <TableCell>{award.credits_awarded}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(award.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right space-x-2">
                {status === 'pending_approval' && (
                  <>
                    <Button size="sm" variant="default">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {t('queue.actions.approve', { defaultValue: 'Approve' })}
                    </Button>
                    <Button size="sm" variant="outline">
                      <XCircle className="h-4 w-4 mr-1" />
                      {t('queue.actions.reject', { defaultValue: 'Reject' })}
                    </Button>
                  </>
                )}
                {status === 'approved' && (
                  <Button size="sm" variant="default">
                    <Gift className="h-4 w-4 mr-1" />
                    {t('queue.actions.issue', { defaultValue: 'Issue' })}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

