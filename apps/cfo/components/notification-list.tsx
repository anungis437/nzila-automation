/**
 * CFO — Notification List (Client Component).
 *
 * Interactive list with mark read, mark all read, and delete actions.
 */
'use client'

import { useState, useTransition } from 'react'
import { Loader2, Trash2, CheckCheck, Mail, MailOpen } from 'lucide-react'
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type Notification,
} from '@/lib/actions/notification-actions'

interface Props {
  initial: Notification[]
}

function priorityColor(p: string) {
  switch (p) {
    case 'urgent': return 'border-l-red-500'
    case 'high': return 'border-l-amber-500'
    case 'normal': return 'border-l-blue-500'
    default: return 'border-l-secondary'
  }
}

export function NotificationList({ initial }: Props) {
  const [items, setItems] = useState(initial)
  const [isPending, startTransition] = useTransition()

  function handleMarkRead(id: string) {
    startTransition(async () => {
      const result = await markNotificationRead(id)
      if (result.success) {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      }
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsRead()
      if (result.success) {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteNotification(id)
      if (result.success) {
        setItems((prev) => prev.filter((n) => n.id !== id))
      }
    })
  }

  const unread = items.filter((n) => !n.read).length

  return (
    <div className="space-y-4">
      {unread > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
            Mark all read
          </button>
        </div>
      )}

      <div className="space-y-2">
        {items.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 rounded-xl border border-l-2 border-border bg-card px-4 py-3 shadow-sm transition-colors ${priorityColor(n.priority)} ${!n.read ? 'bg-electric/5' : ''}`}
          >
            {n.read ? (
              <MailOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${n.read ? 'text-foreground' : 'font-medium text-foreground'}`}>{n.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {n.type.replace(/_/g, ' ')} · {n.createdAt ? new Date(n.createdAt).toLocaleString('en-CA') : ''}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {!n.read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  disabled={isPending}
                  className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  title="Mark read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => handleDelete(n.id)}
                disabled={isPending}
                className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
