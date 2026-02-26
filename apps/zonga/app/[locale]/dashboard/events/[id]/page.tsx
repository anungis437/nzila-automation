/**
 * Zonga — Event Detail Page (Server Component).
 *
 * Full event view: info, ticket stats, performer lineup, and ticket list.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@nzila/ui'
import { getEventDetail } from '@/lib/actions/event-actions'
import { formatCurrencyAmount } from '@/lib/stripe'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { id } = await params
  const { event, tickets, ticketsSold, ticketRevenue } = await getEventDetail(id)

  if (!event) notFound()

  const statusColors: Record<string, string> = {
    draft: 'bg-amber-100 text-amber-700',
    published: 'bg-emerald-100 text-emerald-700',
    sold_out: 'bg-red-100 text-red-600',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-gray-100 text-gray-600',
  }

  const performers = Array.isArray(event.performers) ? event.performers : []

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href="../events" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy transition">
        ← All Events
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">{event.title}</h1>
        <div className="mt-2 flex items-center gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            statusColors[event.status] ?? statusColors.draft
          }`}>
            {event.status?.replace(/_/g, ' ')}
          </span>
          <span className="text-sm text-gray-500">
            {event.venue} · {event.city}, {event.country}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-5">
            <p className="text-xs text-gray-500">Tickets Sold</p>
            <p className="text-2xl font-bold text-navy">{ticketsSold}/{event.totalTickets}</p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="text-xs text-gray-500">Ticket Revenue</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrencyAmount(Math.round(ticketRevenue * 100), event.currency ?? 'USD')}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="text-xs text-gray-500">Price / Ticket</p>
            <p className="text-2xl font-bold text-navy">
              {formatCurrencyAmount(Math.round(Number(event.ticketPrice) * 100), event.currency ?? 'USD')}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="text-xs text-gray-500">Date</p>
            <p className="text-lg font-bold text-navy">
              {new Date(event.startDate).toLocaleDateString('en-CA')}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {event.description && (
            <Card>
              <div className="p-5">
                <h2 className="mb-3 text-sm font-semibold text-navy">📋 Description</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{event.description}</p>
              </div>
            </Card>
          )}

          {/* Performers */}
          {performers.length > 0 && (
            <Card>
              <div className="p-5">
                <h2 className="mb-3 text-sm font-semibold text-navy">🎤 Performer Lineup</h2>
                <div className="flex flex-wrap gap-2">
                  {performers.map((performer: string) => (
                    <span
                      key={performer}
                      className="inline-flex rounded-full bg-electric/10 px-3 py-1 text-xs font-medium text-electric"
                    >
                      {performer}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Tickets Table */}
          <Card>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">
                🎟️ Ticket Purchases ({tickets.length})
              </h2>
              {tickets.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-500">
                  No tickets purchased yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b">
                        <th className="pb-2">Buyer</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Total</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tickets.slice(0, 25).map((t) => (
                        <tr key={t.id}>
                          <td className="py-2">
                            <p className="font-medium text-navy">{t.buyerName ?? t.buyerEmail}</p>
                            {t.buyerName && (
                              <p className="text-xs text-gray-400">{t.buyerEmail}</p>
                            )}
                          </td>
                          <td className="py-2 text-gray-600">{t.quantity}</td>
                          <td className="py-2 font-medium text-navy">
                            {formatCurrencyAmount(Math.round(Number(t.totalPrice) * 100), t.currency ?? 'USD')}
                          </td>
                          <td className="py-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              t.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600'
                              : t.status === 'used' ? 'bg-blue-500/10 text-blue-600'
                              : t.status === 'cancelled' ? 'bg-red-500/10 text-red-600'
                              : 'bg-amber-500/10 text-amber-600'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-2 text-gray-400">
                            {t.createdAt
                              ? new Date(t.createdAt).toLocaleDateString('en-CA')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">📋 Event Info</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Venue</dt>
                  <dd className="text-navy font-medium">{event.venue}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Location</dt>
                  <dd className="text-navy">{event.city}, {event.country}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Start</dt>
                  <dd className="text-navy">{new Date(event.startDate).toLocaleDateString('en-CA')}</dd>
                </div>
                {event.endDate && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">End</dt>
                    <dd className="text-navy">{new Date(event.endDate).toLocaleDateString('en-CA')}</dd>
                  </div>
                )}
                {event.genre && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Genre</dt>
                    <dd className="text-navy">{event.genre.replace(/_/g, ' ')}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">Event ID</dt>
                  <dd className="font-mono text-xs text-navy">{id.slice(0, 12)}…</dd>
                </div>
              </dl>
            </div>
          </Card>

          {/* Capacity Gauge */}
          <Card>
            <div className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy">📊 Capacity</h2>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-electric transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (ticketsSold / Math.max(1, event.totalTickets)) * 100,
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                {ticketsSold} / {event.totalTickets} tickets sold (
                {Math.round((ticketsSold / Math.max(1, event.totalTickets)) * 100)}%)
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
