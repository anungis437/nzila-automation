/**
 * Events — Public marketing page
 *
 * Lists upcoming published events on the Zonga platform.
 * Publicly accessible — no auth required.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicEvents } from '@/lib/public-data'
import ScrollReveal from '@/components/public/scroll-reveal'

export const metadata: Metadata = {
  title: 'Events | Zonga',
  description:
    'Discover live music events, concerts, and festivals on Zonga — the fair-share music platform.',
  openGraph: {
    title: 'Events | Zonga',
    description: 'Discover live music events, concerts, and festivals on Zonga.',
  },
}

export const dynamic = 'force-dynamic'

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function EventsPage() {
  const events = await getPublicEvents({ upcoming: true, limit: 30 })

  return (
    <>
      {/* Hero */}
      <section className="relative bg-navy -mt-16 md:-mt-20 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Upcoming <span className="gradient-text">Events</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Live performances, album launches, and music festivals from
              creators across Africa.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Events List */}
      <section className="bg-navy py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {events.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No upcoming events. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {events.map((event, i) => (
                <ScrollReveal key={event.id} delay={i * 0.05}>
                  <div className="glass-card rounded-2xl overflow-hidden hover-lift transition-all">
                    <div className="flex flex-col md:flex-row">
                      {/* Cover */}
                      <div className="md:w-64 aspect-video md:aspect-auto bg-linear-to-br from-electric/10 to-purple-500/10 flex items-center justify-center shrink-0">
                        {event.coverImageUrl ? (
                          <img
                            src={event.coverImageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-5xl text-white/30">🎤</span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-white">{event.title}</h3>
                            <p className="text-electric text-sm font-medium mt-1">
                              {event.creatorName}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-medium text-white">
                              {formatEventDate(event.startDate)}
                            </div>
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-gray-400 text-sm mt-3 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-gray-500">
                          {event.venue && (
                            <span className="flex items-center gap-1">
                              📍 {event.venue}
                              {event.city && `, ${event.city}`}
                            </span>
                          )}
                          {event.country && <span>{event.country}</span>}
                          {event.ticketCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-electric/10 text-electric">
                              {event.ticketCount} ticket types
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <p className="text-gray-400 mb-4">Want to host your own event?</p>
            <Link
              href="/sign-up"
              className="inline-flex items-center px-8 py-3.5 bg-electric text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-electric/25 btn-press"
            >
              Get Started
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
