'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, Trash2, Edit2, X } from 'lucide-react'

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    username: string
    full_name: string
  } | null
}

interface CommentsSectionProps {
  postId: string
  userId: string | undefined
  initialComments: Comment[]
}

export function CommentsSection({ postId, userId, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      alert('コメントするにはログインが必要です')
      return
    }

    if (!newComment.trim()) return

    setLoading(true)

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: newComment,
      })
      .select(`
        *,
        profiles:user_id (
          username,
          full_name
        )
      `)
      .single()

    if (!error && data) {
      setComments([data as Comment, ...comments])
      setNewComment('')
    }

    setLoading(false)
  }

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return

    setLoading(true)

    const { error } = await supabase
      .from('comments')
      .update({ content: editContent })
      .eq('id', commentId)

    if (!error) {
      setComments(
        comments.map((comment) =>
          comment.id === commentId ? { ...comment, content: editContent } : comment
        )
      )
      setEditingId(null)
      setEditContent('')
    }

    setLoading(false)
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('このコメントを削除しますか？')) return

    setLoading(true)

    const { error } = await supabase.from('comments').delete().eq('id', commentId)

    if (!error) {
      setComments(comments.filter((comment) => comment.id !== commentId))
    }

    setLoading(false)
  }

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          コメント ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {userId && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="コメントを入力..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button type="submit" disabled={loading || !newComment.trim()}>
              {loading ? '投稿中...' : 'コメントする'}
            </Button>
          </form>
        )}

        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              まだコメントがありません
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {(comment.profiles?.full_name || comment.profiles?.username || 'U')
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">
                        {comment.profiles?.full_name || comment.profiles?.username || '匿名'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                  {userId === comment.user_id && editingId !== comment.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(comment)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(comment.id)}
                        disabled={loading || !editContent.trim()}
                      >
                        保存
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                      >
                        <X className="h-4 w-4 mr-2" />
                        キャンセル
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
