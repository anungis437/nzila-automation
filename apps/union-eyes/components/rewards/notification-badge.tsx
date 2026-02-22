'use client';

import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  max?: number;
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

export function NotificationBadge({
  count,
  max = 99,
  className,
  showIcon = true,
  variant = 'destructive',
}: NotificationBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <div className={cn('relative inline-flex', className)}>
      {showIcon && <Bell className="h-5 w-5" />}
      <Badge
        variant={variant}
        className={cn(
          'absolute -top-2 -right-2 h-5 min-w-[1.25rem] px-1 flex items-center justify-center rounded-full text-xs font-bold',
          showIcon ? '' : 'relative top-0 right-0'
        )}
      >
        {displayCount}
      </Badge>
    </div>
  );
}

