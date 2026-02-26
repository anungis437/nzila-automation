/**
 * Notification action buttons — Client components.
 *
 * Mark single notification as read, or mark all as read.
 */
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { markAsRead, markAllRead } from '@/lib/actions/notification-actions'

export function MarkReadButton({ notificationId }: { notificationId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markAsRead(notificationId)
          router.refresh()
        })
      }
      className="flex-shrink-0 rounded-md px-2 py-1 text-xs font-medium text-electric hover:bg-electric/10 transition-colors disabled:opacity-50"
    >
      {pending ? '…' : 'Mark read'}
    </button>
  )
}

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markAllRead()
          router.refresh()
        })
      }
      className="rounded-lg border border-electric px-3 py-1.5 text-xs font-medium text-electric hover:bg-electric/10 transition-colors disabled:opacity-50"
    >
      {pending ? 'Marking…' : 'Mark all read'}
    </button>
  )
}
