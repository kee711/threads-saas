# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Start development server with Turbopack
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run storybook       # Start Storybook dev server
npm run build-storybook # Build Storybook
```

## Architecture Overview

This is a Next.js 15 application for Threads content creation and management, built with TypeScript, React 19, and Supabase.

### Route Structure
- `(landing)/` - Public marketing pages
- `(auth)/` - Authentication flows (signin, error)  
- `(dashboard)/` - Protected application features
  - `contents-cooker/` - Content generation (topic-finder, post-radar, saved)
  - `schedule/` - Content scheduling (calendar, list views)
  - `statistics/` - Analytics dashboard
  - `comments/` - Comment management

### Key Services (`lib/services/`)
- **content.ts** - Manages content from `my_contents` and `external_contents` tables
- **scheduler.ts** - Handles publishing times (30min first post, 3hr intervals) and automatic publishing
- **openai.ts** - GPT-4 integration for content generation
- **threads.ts** - Threads API integration (publishing handled in scheduler)

### State Management (Zustand)
- **useScheduleStore** - Publishing time preferences
- **useSocialAccountStore** - Social account management with account switching
- **useStatisticsStore** - Analytics data with 5-minute cache duration
- **useSelectedPostsStore** - UI state for post selection

### Database (Supabase)
Key tables: `user_profiles`, `my_contents`, `external_contents`, `social_accounts`

### Authentication
NextAuth.js with Google OAuth, JWT strategy, middleware-based route protection

## Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
THREADS_CLIENT_ID=
THREADS_CLIENT_SECRET=
```

## Important Patterns

### API Routes
- Use server components for protected routes
- Edge runtime for AI-powered endpoints (`/api/generate-*`)
- Proper error handling and user ownership verification

### Client Caching
- Statistics store with intelligent caching (5min duration)
- Mobile cache safety with Map object validation
- Cache invalidation on account switching

### UI Components
- Built with Radix UI and TailwindCSS
- Mobile-first responsive design
- Dark mode support via next-themes
- Modal-based interactions for content management

### Testing
- Vitest with Storybook integration
- Browser testing with Playwright
- Test files in `stories/` directory

## Key Integrations

### Threads API
- OAuth flow in `/api/threads/oauth/`
- Media and user insights API
- Content publishing with error handling

### OpenAI
- GPT-4 for content generation
- Custom prompts in `contents-cooker/topic-finder/prompts.ts`
- Edge runtime for performance