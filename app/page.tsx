import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Calendar, User, LogIn } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:author_id (
        username,
        full_name
      )
    `)
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(12)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              ブログサイト
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline">ダッシュボード</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">
                    <LogIn className="mr-2 h-4 w-4" />
                    ログイン
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button>サインアップ</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            最新の投稿
          </h2>
          <p className="text-xl text-muted-foreground">
            みんなの投稿を読んでインスピレーションを得よう
          </p>
        </div>

        {posts && posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-xl">
                      {post.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="text-xs">
                          {post.profiles?.full_name || post.profiles?.username || '匿名'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <time className="text-xs">
                          {new Date(post.created_at).toLocaleDateString('ja-JP')}
                        </time>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-4">
                      {post.content}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold mb-2">
                まだ投稿がありません
              </h3>
              <p className="text-muted-foreground mb-6">
                最初の投稿者になりましょう！
              </p>
              {user ? (
                <Link href="/posts/new">
                  <Button size="lg">投稿を作成</Button>
                </Link>
              ) : (
                <Link href="/signup">
                  <Button size="lg">サインアップして始める</Button>
                </Link>
              )}
            </div>
          </Card>
        )}
      </main>

      <footer className="border-t mt-20 py-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 ブログサイト. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
