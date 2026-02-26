/**
 * Zonga — Events Page (Server Component).
 *
 * Live events listing with status filters and ticket stats.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@nzila/ui'
import { listEvents } from '@/lib/actions/event-actions'
import { formatCurrencyAmount } from '@/lib/stripe'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const params = await searchParams
  const { events, total } = await listEvents({
    page: Number(params.page ?? '1'),
    status: params.status,
  })

  const statusOptions = ['all', 'draft', 'published', 'sold_out', 'completed', 'cancelled']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Events</h1>
          <p className="text-gray-500 mt-1">Live events & ticketing</p>
        </div>
        <Link
          href="events/new"
          className="inline-flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-medium text-white hover:bg-electric/90"
        >
          🎪 New Event
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusOptions.map((s) => (
          <a
            key={s}
            href={`?status=${s === 'all' ? '' : s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              (params.status ?? '') === (s === 'all' ? '' : s)
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </a>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <div className="p-5">
            <p className="text-xs text-gray-500">Total Events</p>
            <p className="text-2xl font-bold text-navy">{total}</p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="text-xs text-gray-500">Showing</p>
            <p className="text-2xl font-bold text-navy">{events.length}</p>
          </div>
        </Card>
      </div>

      {/* Event Grid */}
      {events.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">🎪</div>
            <p className="font-semibold text-navy text-lg">No events found</p>
            <p className="text-gray-500 text-sm mt-1">
              Create your first event to start selling tickets.
            </p>
            <Link
              href="events/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-medium text-white"
            >
              🎪 New Event
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {events.map((event) => (
            <Link key={event.id} href={`events/${event.id}`}>
              <Card>
                <div className="p-5 space-y-3 hover:bg-gray-50 transition-colors rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-navy">{event.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {event.venue} · {event.city}, {event.country}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      event.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : event.status === 'sold_out'
                          ? 'bg-red-500/10 text-red-600'
                          : event.status === 'completed'
                            ? 'bg-blue-500/10 text-blue-600'
                            : event.status === 'draft'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-gray-100 text-gray-500'
                    }`}>
                      {event.status?.replace(/_/g, ' ') ?? 'draft'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📅 {new Date(event.startDate).toLocaleDateString('en-CA')}</span>
                    <span>🎟️ {event.soldTickets}/{event.totalTickets}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-navy">
                      {formatCurrencyAmount(Math.round(Number(event.ticketPrice) * 100), event.currency ?? 'USD')}
                      /ticket
                    </span>
                    {event.genre && (
                      <span className="rounded-full bg-navy/10 px-2 py-0.5 text-navy">
                        {event.genre.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
