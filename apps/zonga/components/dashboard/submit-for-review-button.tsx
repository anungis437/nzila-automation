'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { publishAsset } from '@/lib/actions/catalog-actions'

export function SubmitForReviewButton({ assetId }: { assetId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      const res = await publishAsset(assetId)
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
      {isPending ? 'Submitting…' : 'Submit for Review'}
    </button>
  )
}
