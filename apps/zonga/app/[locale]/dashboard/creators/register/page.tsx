'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@nzila/ui'
import { registerCreator } from '@/lib/actions/creator-actions'

const GENRES = [
  { label: 'Afrobeats', value: 'AFROBEATS' },
  { label: 'Amapiano', value: 'AMAPIANO' },
  { label: 'Soukous', value: 'SOUKOUS' },
  { label: 'Highlife', value: 'HIGHLIFE' },
  { label: 'Bongo Flava', value: 'BONGO_FLAVA' },
  { label: 'Gospel', value: 'AFRO_GOSPEL' },
  { label: 'Afro Hip Hop', value: 'AFRO_HIP_HOP' },
  { label: 'Gengetone', value: 'GENGETONE' },
  { label: 'Kizomba', value: 'KIZOMBA' },
  { label: 'Gqom', value: 'GQOM' },
  { label: 'Raï', value: 'RAI' },
  { label: 'Ndombolo', value: 'NDOMBOLO' },
  { label: 'Congolese Rumba', value: 'CONGOLESE_RUMBA' },
]

const COUNTRIES = [
  { label: 'Nigeria', value: 'NG' },
  { label: 'Kenya', value: 'KE' },
  { label: 'South Africa', value: 'ZA' },
  { label: 'Ghana', value: 'GH' },
  { label: 'Tanzania', value: 'TZ' },
  { label: 'Cameroon', value: 'CM' },
  { label: 'DRC', value: 'CD' },
  { label: 'Senegal', value: 'SN' },
  { label: 'Morocco', value: 'MA' },
  { label: 'Egypt', value: 'EG' },
  { label: 'Ethiopia', value: 'ET' },
  { label: 'Uganda', value: 'UG' },
  { label: 'Ivory Coast', value: 'CI' },
  { label: 'Angola', value: 'AO' },
  { label: 'Rwanda', value: 'RW' },
  { label: 'Congo-Brazzaville', value: 'CG' },
]

export default function RegisterCreatorPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await registerCreator({
        name: fd.get('name') as string,
        email: fd.get('email') as string,
        genre: fd.get('genre') as string || undefined,
        country: fd.get('country') as string || undefined,
      })

      if (!res.success) {
        setError('Failed to register creator. Please try again.')
        return
      }
      router.push(`../${res.creatorId}`)
    })
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy mb-6">Register Creator</h1>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              name="name"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
              placeholder="Artist or creator name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
              placeholder="creator@example.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
              <select
                name="genre"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
              >
                <option value="">Select genre</option>
                {GENRES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                name="country"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-electric focus:border-transparent"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-electric text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-electric/90 transition disabled:opacity-50"
            >
              {isPending ? 'Registering…' : 'Register Creator'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
