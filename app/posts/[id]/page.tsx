import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, Calendar, User, Home, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { LikeButton } from '@/components/post/like-button'
import { CommentsSection } from '@/components/post/comments-section'

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:author_id (
        username,
        full_name
      )
    `)
    .eq('id', id)
    .single()

  if (!post) {
    notFound()
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthor = user?.id === post.author_id

  // Get likes count and user's like status
  const { count: likesCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', id)

  let isLiked = false
  if (user) {
    const { data: userLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single()

    isLiked = !!userLike
  }

  // Get comments
  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id (
        username,
        full_name
      )
    `)
    .eq('post_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={isAuthor ? '/dashboard' : '/'}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                戻る
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="mr-2 h-4 w-4" />
                ホーム
              </Button>
            </Link>
            <Link href="/#published-posts">
              <Button variant="ghost" size="sm">
                <BookOpen className="mr-2 h-4 w-4" />
                公開投稿
              </Button>
            </Link>
          </div>
          {isAuthor && (
            <Link href={`/posts/${id}/edit`}>
              <Button size="sm">編集</Button>
            </Link>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-4">
              <div>
                {!post.published && (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 mb-4">
                    下書き
                  </span>
                )}
                <h1 className="text-4xl font-bold mt-2">{post.title}</h1>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{post.profiles?.full_name || post.profiles?.username || '匿名'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <time>{new Date(post.created_at).toLocaleDateString('ja-JP')}</time>
                  </div>
                </div>
                <LikeButton
                  postId={id}
                  initialLikes={likesCount || 0}
                  initialIsLiked={isLiked}
                  userId={user?.id}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>
            </CardContent>
          </Card>

          <CommentsSection
            postId={id}
            userId={user?.id}
            initialComments={comments || []}
          />
        </div>
      </main>
    </div>
  )
}
