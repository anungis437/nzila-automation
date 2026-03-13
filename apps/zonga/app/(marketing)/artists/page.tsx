/**
 * Artists Directory — Public marketing page
 *
 * Lists all active creators on the Zonga platform.
 * Publicly accessible — no auth required.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicArtists, getArtistFacets } from '@/lib/public-data'
import ScrollReveal from '@/components/public/scroll-reveal'

export const metadata: Metadata = {
  title: 'Artists | Zonga',
  description:
    'Discover African musicians, producers, and creators on Zonga — the fair-share music platform.',
  openGraph: {
    title: 'Artists | Zonga',
    description: 'Discover African musicians, producers, and creators on Zonga.',
  },
}

export const dynamic = 'force-dynamic'

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; country?: string }>
}) {
  const params = await searchParams
  const [artists, facets] = await Promise.all([
    getPublicArtists({ genre: params.genre, country: params.country }),
    getArtistFacets(),
  ])

  return (
    <>
      {/* Hero */}
      <section className="relative bg-navy -mt-16 md:-mt-20 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Discover <span className="gradient-text">Artists</span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Explore musicians, producers, and creators from across Africa — shaping
              the sound of tomorrow.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-navy-light border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap gap-3">
          <FilterPill href="/artists" label="All" active={!params.genre && !params.country} />
          {facets.genres.slice(0, 8).map((g) => (
            <FilterPill key={g} href={`/artists?genre=${encodeURIComponent(g)}`} label={g} active={params.genre === g} />
          ))}
          {facets.countries.slice(0, 6).map((c) => (
            <FilterPill key={c} href={`/artists?country=${encodeURIComponent(c)}`} label={c} active={params.country === c} />
          ))}
        </div>
      </section>

      {/* Artist Grid */}
      <section className="bg-navy py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {artists.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No artists found. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {artists.map((artist, i) => (
                <ScrollReveal key={artist.id} delay={i * 0.05}>
                  <Link
                    href={`/artists/${artist.id}`}
                    className="glass-card group block rounded-2xl overflow-hidden hover-lift transition-all"
                  >
                    {/* Avatar */}
                    <div className="aspect-square bg-linear-to-br from-electric/20 to-purple-500/20 flex items-center justify-center">
                      {artist.avatarUrl ? (
                        <img
                          src={artist.avatarUrl}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-5xl text-white/40">🎵</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <h3 className="text-white font-semibold text-lg truncate group-hover:text-electric transition-colors">
                        {artist.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                        {artist.genre && <span>{artist.genre}</span>}
                        {artist.genre && artist.country && <span>·</span>}
                        {artist.country && <span>{artist.country}</span>}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span>{artist.followerCount.toLocaleString()} followers</span>
                        <span>{artist.releaseCount} releases</span>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}

function FilterPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-electric text-white'
          : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
    </Link>
  )
}
