/**
 * Zonga Server Actions — Notifications.
 *
 * In-app notification CRUD: list, mark-read, mark-all-read, create.
 * Stored via audit_log for event-sourced state.
 */
'use server'

import { auth } from '@clerk/nextjs/server'
import { platformDb } from '@nzila/db/platform'
import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

/* ─── Types ─── */

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body?: string
  link?: string
  read: boolean
  createdAt?: Date
}

/* ─── List ─── */

export async function listNotifications(opts?: {
  unreadOnly?: boolean
}): Promise<Notification[]> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const rows = (await platformDb.execute(
      sql`SELECT
        entity_id as id,
        metadata->>'userId' as "userId",
        metadata->>'type' as type,
        metadata->>'title' as title,
        metadata->>'body' as body,
        metadata->>'link' as link,
        COALESCE((metadata->>'read')::boolean, false) as read,
        created_at as "createdAt"
      FROM audit_log
      WHERE action = 'notification.created' AND metadata->>'userId' = ${userId}
      ORDER BY created_at DESC
      LIMIT 100`,
    )) as unknown as { rows: Notification[] }

    // Build read-set from notification.read events
    const readRows = (await platformDb.execute(
      sql`SELECT metadata->>'notificationId' as id FROM audit_log
      WHERE action = 'notification.read' AND actor_id = ${userId}`,
    )) as unknown as { rows: { id: string }[] }

    const readSet = new Set((readRows.rows ?? []).map((r) => r.id))

    const allReadAt = (await platformDb.execute(
      sql`SELECT created_at FROM audit_log
      WHERE action = 'notification.read_all' AND actor_id = ${userId}
      ORDER BY created_at DESC LIMIT 1`,
    )) as unknown as { rows: { created_at: Date }[] }

    const allReadDate = allReadAt.rows?.[0]?.created_at

    const notifications = (rows.rows ?? []).map((n) => ({
      ...n,
      read:
        readSet.has(n.id) ||
        !!(allReadDate && n.createdAt && new Date(n.createdAt) < new Date(allReadDate)),
    }))

    if (opts?.unreadOnly) {
      return notifications.filter((n) => !n.read)
    }

    return notifications
  } catch (error) {
    logger.error('listNotifications failed', { error })
    return []
  }
}

/* ─── Unread count ─── */

export async function getUnreadCount(): Promise<number> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const notifications = await listNotifications({ unreadOnly: true })
    return notifications.length
  } catch (error) {
    logger.error('getUnreadCount failed', { error })
    return 0
  }
}

/* ─── Mark single as read ─── */

export async function markAsRead(notificationId: string): Promise<{ success: boolean }> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('notification.read', ${userId}, 'notification', ${crypto.randomUUID()},
        ${JSON.stringify({ notificationId })}::jsonb)`,
    )

    revalidatePath('/dashboard/notifications')
    return { success: true }
  } catch (error) {
    logger.error('markAsRead failed', { error })
    return { success: false }
  }
}

/* ─── Mark all as read ─── */

export async function markAllRead(): Promise<{ success: boolean }> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('notification.read_all', ${userId}, 'notification', ${crypto.randomUUID()},
        ${JSON.stringify({ userId })}::jsonb)`,
    )

    revalidatePath('/dashboard/notifications')
    return { success: true }
  } catch (error) {
    logger.error('markAllRead failed', { error })
    return { success: false }
  }
}

/* ─── Create notification (used internally by other actions) ─── */

export async function createNotification(data: {
  userId: string
  type: string
  title: string
  body?: string
  link?: string
}): Promise<{ success: boolean; notificationId?: string }> {
  try {
    const notificationId = crypto.randomUUID()

    await platformDb.execute(
      sql`INSERT INTO audit_log (action, actor_id, entity_type, entity_id, metadata)
      VALUES ('notification.created', 'system', 'notification', ${notificationId},
        ${JSON.stringify({
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          link: data.link,
          read: false,
        })}::jsonb)`,
    )

    return { success: true, notificationId }
  } catch (error) {
    logger.error('createNotification failed', { error })
    return { success: false }
  }
}
