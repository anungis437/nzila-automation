/**
 * Follow Button — Client component for following/unfollowing creators.
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { followUser, unfollowUser } from '@/lib/actions/social-actions'

export function FollowButton({
  followingId,
  followingName,
}: {
  followingId: string
  followingName?: string
}) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (isFollowing) {
            await unfollowUser(followingId)
            setIsFollowing(false)
          } else {
            await followUser(followingId, followingName)
            setIsFollowing(true)
          }
          router.refresh()
        })
      }
      className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
        isFollowing
          ? 'border border-white/30 bg-transparent text-white hover:bg-white/10'
          : 'bg-electric text-white hover:bg-electric/90'
      }`}
    >
      {pending ? '…' : isFollowing ? 'Following' : 'Follow'}
    </button>
  )
}
