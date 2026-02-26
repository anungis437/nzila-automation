'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { publishRelease } from '@/lib/actions/release-actions'

export function PublishReleaseButton({ releaseId }: { releaseId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      const res = await publishRelease(releaseId)
      if (res.success) {
        router.refresh()
      }
    })
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="block w-full rounded-lg bg-electric px-3 py-2 text-xs font-medium text-white hover:bg-electric/90 disabled:opacity-50"
    >
      {isPending ? 'Publishing…' : 'Publish Release'}
    </button>
  )
}
