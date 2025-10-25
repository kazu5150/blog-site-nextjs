import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { PenSquare, LogOut } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || profile?.username}
            </span>
            <form action="/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">あなたの投稿</h2>
            <p className="text-muted-foreground mt-2">
              投稿を管理してブログを作成しましょう
            </p>
          </div>
          <Link href="/posts/new">
            <Button size="lg">
              <PenSquare className="mr-2 h-4 w-4" />
              新規投稿
            </Button>
          </Link>
        </div>

        {posts && posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {new Date(post.created_at).toLocaleDateString('ja-JP')}
                      </CardDescription>
                    </div>
                    <span
                      className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        post.published
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                      }`}
                    >
                      {post.published ? '公開' : '下書き'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {post.content}
                  </p>
                  <div className="flex gap-2">
                    <Link href={`/posts/${post.id}/edit`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        編集
                      </Button>
                    </Link>
                    <Link href={`/posts/${post.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full" size="sm">
                        表示
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <PenSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">投稿がありません</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                最初の投稿を作成してブログを始めましょう
              </p>
              <Link href="/posts/new">
                <Button className="mt-6">
                  <PenSquare className="mr-2 h-4 w-4" />
                  新規投稿を作成
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </main>
    </div>
  )
}
