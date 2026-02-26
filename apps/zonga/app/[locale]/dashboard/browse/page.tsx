/**
 * Zonga — Browse / Discover page (Listener-facing).
 *
 * Public-ish browse of published content, trending tracks,
 * featured playlists, and upcoming events. This is the
 * "Spotify home" equivalent for the Zonga dashboard.
 */
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@nzila/ui'
import { listCatalogAssets } from '@/lib/actions/catalog-actions'
import { listEvents } from '@/lib/actions/event-actions'
import { listPlaylists } from '@/lib/actions/playlist-actions'
import { getTrending } from '@/lib/actions/search-actions'

export default async function BrowsePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const { locale } = await params

  const [publishedAssets, upcomingEvents, playlists, trending] = await Promise.all([
    listCatalogAssets({ status: 'published' }),
    listEvents({ status: 'published' }),
    listPlaylists(),
    getTrending(),
  ])

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-navy via-navy/90 to-electric p-8 text-white">
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="mt-2 text-sm text-white/70">
          Explore the best of African music — afrobeats, amapiano, highlife, rumba, and more.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href={`/${locale}/dashboard/search`}
            className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30 transition-colors"
          >
            🔍 Search
          </Link>
          <Link
            href={`/${locale}/dashboard/playlists`}
            className="rounded-lg bg-electric px-4 py-2 text-sm font-medium hover:bg-electric/90 transition-colors"
          >
            📋 Playlists
          </Link>
        </div>
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-navy">🔥 Trending Now</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {trending.slice(0, 10).map((track) => (
              <Link key={track.id} href={`/${locale}/dashboard/catalog/${track.id}`}>
                <Card>
                  <div className="p-4 text-center hover:bg-gray-50 transition-colors rounded-lg">
                    <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-gradient-to-br from-electric/20 to-navy/20 flex items-center justify-center">
                      <span className="text-2xl">🎵</span>
                    </div>
                    <p className="text-xs font-medium text-navy truncate">{track.title ?? 'Untitled'}</p>
                    <p className="mt-0.5 text-xs text-gray-500 truncate">{track.subtitle ?? '—'}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Releases */}
      {publishedAssets.assets.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">📀 New Releases</h2>
            <Link href={`/${locale}/dashboard/catalog`} className="text-xs text-electric hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {publishedAssets.assets.slice(0, 8).map((asset) => (
              <Link key={asset.id} href={`/${locale}/dashboard/catalog/${asset.id}`}>
                <Card>
                  <div className="p-4 hover:bg-gray-50 transition-colors rounded-lg">
                    <div className="mb-3 h-32 rounded-lg bg-gradient-to-br from-navy/10 to-electric/10 flex items-center justify-center">
                      <span className="text-4xl">🎶</span>
                    </div>
                    <p className="text-sm font-medium text-navy truncate">{asset.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500 truncate">{(asset.metadata?.creatorName as string) ?? '—'}</p>
                    {asset.genre && (
                      <span className="mt-1 inline-flex rounded-full bg-navy/10 px-2 py-0.5 text-xs text-navy">
                        {asset.genre.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Playlists */}
      {playlists.playlists.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">📋 Featured Playlists</h2>
            <Link href={`/${locale}/dashboard/playlists`} className="text-xs text-electric hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.playlists.slice(0, 6).map((pl) => (
              <Link key={pl.id} href={`/${locale}/dashboard/playlists/${pl.id}`}>
                <Card>
                  <div className="p-4 hover:bg-gray-50 transition-colors rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-400 to-electric flex items-center justify-center flex-shrink-0">
                        <span className="text-lg text-white">♫</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy truncate">{pl.title}</p>
                        <p className="text-xs text-gray-500">{pl.trackCount ?? 0} tracks</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.events.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">🎪 Upcoming Events</h2>
            <Link href={`/${locale}/dashboard/events`} className="text-xs text-electric hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.events.slice(0, 6).map((event) => (
              <Link key={event.id} href={`/${locale}/dashboard/events/${event.id}`}>
                <Card>
                  <div className="p-4 hover:bg-gray-50 transition-colors rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 rounded-lg bg-purple-100 px-3 py-2 text-center">
                        <p className="text-xs font-bold text-purple-700">
                          {event.startDate
                            ? new Date(event.startDate).toLocaleDateString('en-CA', { month: 'short' })
                            : '—'}
                        </p>
                        <p className="text-lg font-bold text-purple-800">
                          {event.startDate
                            ? new Date(event.startDate).getDate()
                            : '—'}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy truncate">{event.title}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {[event.venue, event.city].filter(Boolean).join(', ')}
                        </p>
                        {event.ticketPrice !== undefined && (
                          <p className="mt-1 text-xs font-medium text-emerald-600">
                            From {event.currency ?? 'USD'} {event.ticketPrice}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {publishedAssets.assets.length === 0 && trending.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <p className="text-4xl">🌍</p>
            <p className="mt-3 text-sm font-medium text-navy">
              Content coming soon
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Creators are uploading new music. Check back soon!
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
