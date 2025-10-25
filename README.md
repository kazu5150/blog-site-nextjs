# ブログ投稿サイト

Next.js、Supabase、shadcn/uiを使用したモダンなブログ投稿プラットフォームです。

## 🌟 機能

- ✅ **ユーザー認証**
  - メールアドレス・パスワードでの登録/ログイン
  - Googleアカウントでのソーシャルログイン（OAuth）
  - セキュアなセッション管理

- ✅ **ブログ投稿管理**
  - ブログ記事の作成・編集・削除
  - 下書き/公開ステータスの切り替え
  - 自分の投稿一覧をダッシュボードで管理

- ✅ **閲覧機能**
  - 公開された記事の一覧表示
  - 個別記事の詳細表示
  - 投稿者情報の表示

- ✅ **モダンなUI/UX**
  - レスポンシブデザイン
  - ダークモード対応
  - グラデーション背景とガラスモーフィズムエフェクト
  - スムーズなアニメーション

## 🛠️ 技術スタック

- **フロントエンド**
  - [Next.js 16](https://nextjs.org/) - App Router使用
  - [React 19](https://react.dev/)
  - [TypeScript](https://www.typescriptlang.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/)
  - [Lucide Icons](https://lucide.dev/)

- **バックエンド**
  - [Supabase](https://supabase.com/) - 認証・データベース
  - PostgreSQL（Supabase経由）
  - Row Level Security (RLS)

- **開発ツール**
  - Turbopack（Next.js 16の高速開発サーバー）
  - ESLint
  - TypeScript

## 📋 前提条件

- Node.js 18以上
- npm または yarn
- Supabaseアカウント（無料プランで可）
- Google Cloud Platform アカウント（Google OAuth用、オプション）

## 🚀 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd testSite-Atras
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスしてログイン
2. 「New Project」をクリック
3. プロジェクト名、データベースパスワード、リージョン（ap-northeast-1推奨）を設定
4. プロジェクトが作成されるまで数分待つ

### 4. データベーススキーマの設定

Supabaseダッシュボードで以下のSQLを実行：

1. **SQL Editorを開く**: ダッシュボード左メニュー → SQL Editor → New Query

2. **以下のSQLを貼り付けて実行**:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Posts policies
CREATE POLICY "Published posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (published = true OR auth.uid() = author_id);

CREATE POLICY "Users can create own posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = author_id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
  new_full_name TEXT;
BEGIN
  -- Get username from metadata or generate from email
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'user_name',
    split_part(NEW.email, '@', 1)
  );

  -- Get full name from metadata or use email
  new_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Insert profile
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    new_username,
    new_full_name,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If username already exists, append random suffix
    new_username := new_username || '_' || substr(md5(random()::text), 1, 6);
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
      NEW.id,
      new_username,
      new_full_name,
      NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_posts_updated
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### 5. 環境変数の設定

1. プロジェクトのルートディレクトリに `.env.local` ファイルを作成

2. Supabaseダッシュボードから以下の情報を取得:
   - **Project Settings** → **API** → **Project URL** と **anon/public key**

3. `.env.local` に以下を記述:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Google OAuth の設定（オプション）

#### 6-1. Google Cloud Console での設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. **APIとサービス** → **認証情報** に移動
4. **OAuth同意画面** を設定:
   - ユーザータイプ: 外部
   - アプリ名、サポートメールなど必要事項を入力
5. **認証情報を作成** → **OAuthクライアントID**
6. アプリケーションの種類: **ウェブアプリケーション**
7. **承認済みのリダイレクトURI** に以下を追加:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
8. 作成後、**クライアントID** と **クライアントシークレット** をコピー

#### 6-2. Supabase での Google OAuth 有効化

1. Supabaseダッシュボード → **Authentication** → **Providers**
2. **Google** を選択
3. 以下を設定:
   - **Enable Sign in with Google**: ON
   - **Client ID**: Google Cloud Console からコピーしたクライアントID
   - **Client Secret**: Google Cloud Console からコピーしたクライアントシークレット
4. **Save** をクリック

### 7. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 にアクセス

## 📝 開発コマンド

```bash
# 開発サーバーの起動（Turbopack使用）
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start

# ESLint実行
npm run lint
```

## 📁 プロジェクト構造

```
.
├── app/                        # Next.js App Router
│   ├── (auth)/
│   │   ├── login/             # ログインページ
│   │   └── signup/            # サインアップページ
│   ├── auth/
│   │   ├── callback/          # OAuth コールバック
│   │   └── signout/           # ログアウト処理
│   ├── dashboard/             # ダッシュボード（保護ルート）
│   ├── posts/
│   │   ├── new/              # 新規投稿作成
│   │   └── [id]/             # 投稿詳細・編集
│   ├── globals.css           # グローバルスタイル
│   ├── layout.tsx            # ルートレイアウト
│   └── page.tsx              # ホームページ
├── components/
│   └── ui/                   # shadcn/ui コンポーネント
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # クライアントサイド Supabase
│   │   ├── server.ts         # サーバーサイド Supabase
│   │   └── middleware.ts     # ミドルウェア用 Supabase
│   └── utils.ts              # ユーティリティ関数
├── middleware.ts             # Next.js ミドルウェア
└── tailwind.config.ts        # Tailwind CSS 設定
```

## 🔒 セキュリティ機能

- **Row Level Security (RLS)**: データベースレベルでのアクセス制御
- **認証ミドルウェア**: 保護されたルートへの不正アクセスを防止
- **セッション管理**: Supabaseによる安全なセッション管理
- **環境変数**: 機密情報は環境変数で管理

## 🎨 デザインシステム

- **カラーシステム**: CSS変数ベースのテーマ
- **ダークモード**: システム設定に対応
- **レスポンシブ**: モバイル・タブレット・デスクトップ対応
- **アニメーション**: Tailwind CSS Animate使用

## 🌐 デプロイ

### Vercel へのデプロイ（推奨）

1. [Vercel](https://vercel.com/) にリポジトリを接続
2. 環境変数を設定:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. デプロイ

### その他のプラットフォーム

- Netlify
- AWS Amplify
- Railway

いずれの場合も環境変数の設定を忘れずに行ってください。

## 🐛 トラブルシューティング

### Googleログイン後に投稿できない

プロフィールが正しく作成されていない可能性があります。以下のSQLで確認・修正:

```sql
-- プロフィールが存在しないユーザーを確認
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 存在しない場合は手動作成
INSERT INTO public.profiles (id, username, full_name)
SELECT
  au.id,
  split_part(au.email, '@', 1),
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1))
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

### ビルドエラーが発生する

1. Node.jsバージョンを確認（18以上必要）
2. `node_modules` を削除して再インストール:
   ```bash
   rm -rf node_modules
   npm install
   ```

### 環境変数が読み込まれない

- `.env.local` ファイルが正しい場所にあるか確認
- 開発サーバーを再起動
- 環境変数名が `NEXT_PUBLIC_` で始まっているか確認

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 📞 サポート

質問や問題がある場合は、GitHubのIssuesを使用してください。

---

**Built with ❤️ using Next.js, Supabase, and shadcn/ui**
