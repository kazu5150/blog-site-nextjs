# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a blog posting website built with Next.js 16 (App Router), Supabase for backend/auth, and shadcn/ui + Tailwind CSS for styling. Users can sign up via email/password or Google OAuth, create/edit/delete blog posts, and view published posts.

## Development Commands

```bash
# Start development server (uses Turbopack)
npm run dev

# Build for production
npm build

# Start production server
npm start

# Run ESLint
npm run lint
```

## Architecture

### Authentication & Session Management

The app uses **Supabase Auth** with a critical three-layer pattern for handling sessions:

1. **Client Components** (`lib/supabase/client.ts`): Uses `createBrowserClient` for client-side auth operations (login, signup, OAuth)
2. **Server Components** (`lib/supabase/server.ts`): Uses `createServerClient` with Next.js cookies() for server-side data fetching
3. **Middleware** (`lib/supabase/middleware.ts`): Refreshes auth sessions on every request and redirects unauthenticated users

**Critical**: The middleware (`middleware.ts`) runs on all routes except static assets. It protects routes by redirecting non-authenticated users to `/login` (except for `/`, `/login`, and `/signup`).

### OAuth Flow

Google OAuth is implemented with the following flow:
1. User clicks "Googleでログイン" → triggers `signInWithOAuth()` with redirectTo pointing to `/auth/callback`
2. Google redirects back to `/auth/callback/route.ts`
3. Callback handler exchanges code for session via `exchangeCodeForSession()`
4. User is redirected to `/dashboard`

### Database Schema

**Tables**:
- `profiles`: User profile data (username, full_name, avatar_url). Has 1:1 relationship with `auth.users`
- `posts`: Blog posts (title, content, published, author_id references profiles)

**Important**: A Postgres trigger (`handle_new_user()`) automatically creates a profile entry when a user signs up. This trigger handles both email/password and OAuth signups by extracting metadata from `raw_user_meta_data`.

### Route Protection Pattern

Protected routes (like `/dashboard`, `/posts/new`, `/posts/[id]/edit`) use Server Components that:
1. Call `await createClient()` from `lib/supabase/server`
2. Call `supabase.auth.getUser()`
3. Redirect to `/login` if no user found

Example:
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

### Data Fetching Patterns

**Server Components** (preferred for initial page loads):
- Use `lib/supabase/server`
- Can directly query database in async components
- Example: Homepage fetches published posts with author profile via join

**Client Components** (for mutations):
- Use `lib/supabase/client`
- Handle form submissions, OAuth triggers
- Example: Login/signup forms, post creation/editing

### UI Component System

Uses shadcn/ui with Tailwind CSS. Components are in `components/ui/`. The `cn()` utility from `lib/utils.ts` merges Tailwind classes using `clsx` + `tailwind-merge`.

Design system uses CSS variables defined in `app/globals.css` for theming (supports dark mode via `.dark` class).

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
```

## Key Implementation Details

### Supabase MCP Integration

This project was built using Supabase MCP tools (`mcp__supabase__*`). When making database schema changes, use:
- `mcp__supabase__apply_migration` for DDL operations
- `mcp__supabase__execute_sql` for queries (read-only or DML)

### Profile Creation for OAuth Users

The `handle_new_user()` trigger extracts user metadata with fallbacks:
- Username: `raw_user_meta_data->>'username'` OR `raw_user_meta_data->>'user_name'` OR email prefix
- Full name: `raw_user_meta_data->>'name'` OR `raw_user_meta_data->>'full_name'` OR email prefix

If username conflicts occur, a random suffix is appended via exception handling.

### Route Structure

```
/                   # Public homepage (shows published posts)
/login              # Login page (email/password + Google OAuth)
/signup             # Signup page (email/password + Google OAuth)
/dashboard          # User's post management (protected)
/posts/new          # Create new post (protected)
/posts/[id]         # View single post (public if published, author-only if draft)
/posts/[id]/edit    # Edit post (protected, author-only)
/auth/callback      # OAuth callback handler
/auth/signout       # Sign out route handler
```

## Styling Patterns

- Gradient backgrounds: `bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900`
- Glass morphism: `bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm`
- Text gradients: `bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent`
