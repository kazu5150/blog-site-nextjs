'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'

interface LikeButtonProps {
  postId: string
  initialLikes: number
  initialIsLiked: boolean
  userId: string | undefined
}

export function LikeButton({ postId, initialLikes, initialIsLiked, userId }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLike = async () => {
    if (!userId) {
      alert('いいねするにはログインが必要です')
      return
    }

    setLoading(true)

    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)

      if (!error) {
        setLikes(likes - 1)
        setIsLiked(false)
      }
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: postId,
          user_id: userId,
        })

      if (!error) {
        setLikes(likes + 1)
        setIsLiked(true)
      }
    }

    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isLiked ? 'default' : 'outline'}
        size="sm"
        onClick={handleLike}
        disabled={loading}
        className={isLiked ? 'bg-red-500 hover:bg-red-600' : ''}
      >
        <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
        {likes}
      </Button>
    </div>
  )
}
