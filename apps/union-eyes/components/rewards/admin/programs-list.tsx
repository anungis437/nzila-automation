'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Archive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';
import type { RecognitionProgram } from '@/db/schema/recognition-rewards-schema';

interface ProgramsListProps {
  programs: RecognitionProgram[];
}

export function ProgramsList({ programs }: ProgramsListProps) {
  const t = useTranslations('rewards.admin.programs');

  if (programs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>{t('list.empty', { defaultValue: 'No programs created yet' })}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('list.columns.name', { defaultValue: 'Program Name' })}</TableHead>
            <TableHead>{t('list.columns.status', { defaultValue: 'Status' })}</TableHead>
            <TableHead>{t('list.columns.created', { defaultValue: 'Created' })}</TableHead>
            <TableHead className="text-right">
              {t('list.columns.actions', { defaultValue: 'Actions' })}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programs.map((program) => (
            <TableRow key={program.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{program.name}</span>
                  {program.description && (
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {program.description}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={program.status === 'active' ? 'default' : 'secondary'}
                >
                  {program.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(program.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">
                        {t('list.actions.open', { defaultValue: 'Open menu' })}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('list.actions.edit', { defaultValue: 'Edit' })}
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="mr-2 h-4 w-4" />
                      {program.status === 'active'
                        ? t('list.actions.archive', { defaultValue: 'Archive' })
                        : t('list.actions.activate', { defaultValue: 'Activate' })}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

