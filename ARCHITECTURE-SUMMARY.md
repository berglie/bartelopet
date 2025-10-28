# Barteløpet Architecture - Quick Reference

## Tech Stack

```
Frontend:  Next.js 14 (App Router) + TypeScript + Tailwind CSS
Backend:   Supabase (PostgreSQL + Auth + Storage)
Language:  Norwegian (nb-NO)
Hosting:   Vercel
```

## Project Structure Overview

```
barteløpet/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, callback
│   │   ├── (public)/           # Gallery, participants, about
│   │   ├── (protected)/        # Dashboard, registration, profile
│   │   └── api/                # REST API routes
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # Base components (Button, Card, etc.)
│   │   ├── layout/             # Header, Footer, Navigation
│   │   ├── forms/              # Form components
│   │   ├── gallery/            # Gallery components
│   │   ├── participants/       # Participant components
│   │   ├── upload/             # Upload components
│   │   └── providers/          # Context providers
│   │
│   ├── lib/                    # Core libraries
│   │   ├── supabase/           # Supabase clients
│   │   ├── validations/        # Zod schemas
│   │   ├── utils/              # Utility functions
│   │   └── constants/          # App constants
│   │
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript types
│   └── middleware.ts           # Auth middleware
│
├── supabase/
│   └── migrations/             # Database migrations
│
└── public/                     # Static assets
```

## Database Schema

### Tables

**participants**
- User profile information
- Distance tracking
- Stats aggregation

**completions**
- Run completion records
- Images (original + thumbnail)
- Vote counts

**votes**
- User votes for completions
- One vote per participant per completion

### Relationships

```
auth.users (1) ──► (1) participants (1) ──► (*) completions (1) ──► (*) votes
                                     └─────────────────────────────────┘
                                           (participant can vote)
```

## Routes Structure

```
/                           Homepage (public)
/om                         About (public)
/login                      Login (public)
/auth-callback              Auth handler

/galleri                    Gallery grid (public)
/galleri/[id]               Photo detail (public)

/deltakere                  Participants list (public)
/deltakere/[id]             Participant profile (public)

/registrering               Registration (protected)
/dashboard                  User dashboard (protected)
/profil                     Edit profile (protected)
```

## API Endpoints

```
GET    /api/participants              List participants
POST   /api/participants              Create participant
GET    /api/participants/[id]         Get participant
PATCH  /api/participants/[id]         Update participant
DELETE /api/participants/[id]         Delete participant

GET    /api/completions               List completions
POST   /api/completions               Create completion
GET    /api/completions/[id]          Get completion
PATCH  /api/completions/[id]          Update completion
DELETE /api/completions/[id]          Delete completion

POST   /api/completions/[id]/vote     Vote for completion
DELETE /api/completions/[id]/vote     Remove vote

GET    /api/votes                     Get user votes
POST   /api/upload                    Upload image
GET    /api/stats                     Global statistics
```

## Component Categories

### Server Components (Default)
- Static content
- Data fetching
- Layouts
- SEO-critical pages

### Client Components ('use client')
- Forms and inputs
- Interactive elements
- Hooks usage (useState, useEffect)
- Browser APIs
- Event handlers

## Authentication Flow

```
1. User enters email on /login
2. Supabase sends magic link
3. User clicks link → /auth-callback
4. Exchange token for session
5. Check if participant exists
   - Yes → /dashboard
   - No → /registrering
```

## Image Upload Flow

```
1. Client: Select image, validate, preview
2. API: Receive, validate, resize (1920px max)
3. API: Create thumbnail (400x400)
4. API: Upload to Supabase Storage
5. API: Return URLs
6. Client: Save URLs to completion record
```

## State Management

- **Server State:** React Server Components + Next.js caching
- **Client UI State:** React hooks (useState, useReducer)
- **Global UI State:** Context API (Auth, Toast)
- **Form State:** React Hook Form + Zod validation

## TypeScript Interfaces

### Core Types

```typescript
interface Participant {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  target_distance_km: number;
  current_distance_km: number;
  total_completions: number;
  total_votes_received: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Completion {
  id: string;
  participant_id: string;
  distance_km: number;
  duration_minutes: number | null;
  location: string | null;
  notes: string | null;
  image_url: string;
  thumbnail_url: string;
  vote_count: number;
  is_featured: boolean;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

interface Vote {
  id: string;
  participant_id: string;
  completion_id: string;
  created_at: string;
}
```

## Security Checklist

- [x] Magic link authentication (passwordless)
- [x] Row Level Security (RLS) on all tables
- [x] Route protection with middleware
- [x] API route authentication guards
- [x] Input validation (Zod) on client and server
- [x] File type and size validation
- [x] Storage bucket RLS policies
- [x] CSRF protection (Next.js built-in)
- [x] XSS protection (React built-in)
- [ ] Rate limiting (consider adding)
- [ ] Content Security Policy headers

## Performance Optimizations

- **Server Components:** Reduce client JS
- **Static Generation:** Pre-render public pages
- **ISR:** Revalidate cached pages (60s)
- **Image Optimization:** next/image + Sharp
- **Code Splitting:** Route-based (automatic)
- **Database Indexes:** On frequently queried columns
- **CDN:** Supabase Storage + Vercel Edge Network

## Color Palette (Earth Tones)

```javascript
primary: {
  500: '#8c7355',  // Main brown
  600: '#705d46',  // Darker brown
}

accent: {
  500: '#42896f',  // Earthy green
  600: '#316d59',  // Darker green
}
```

## Norwegian UI Text Patterns

```typescript
// Common patterns
{
  auth: {
    login: 'Logg inn',
    logout: 'Logg ut',
    register: 'Registrer deg',
  },
  actions: {
    save: 'Lagre',
    cancel: 'Avbryt',
    delete: 'Slett',
    edit: 'Rediger',
    upload: 'Last opp',
    vote: 'Stem',
    back: 'Tilbake',
  },
  status: {
    loading: 'Laster...',
    success: 'Suksess',
    error: 'Noe gikk galt',
  }
}
```

## Deployment Pipeline

```
Git Push → GitHub → Vercel

main branch:
1. Run tests
2. Build project
3. Run migrations
4. Deploy to production

feature branches:
1. Run tests
2. Build project
3. Deploy preview environment
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_APP_URL=https://bartelopet.no

# Optional
SENTRY_DSN=https://xxx@sentry.io/xxx
```

## Key Design Decisions

1. **Next.js 14 App Router** - Modern React, server-first
2. **Supabase** - Managed backend, built-in auth
3. **TypeScript Strict** - Type safety, better DX
4. **Tailwind CSS** - Utility-first, rapid development
5. **Server Components** - Default, 'use client' only when needed
6. **Zod Validation** - Type-safe validation
7. **Sharp** - Image processing on upload
8. **Progressive Enhancement** - Works without JS
9. **Norwegian First** - UI in Norwegian from start

## Development Workflow

```bash
# Install dependencies
pnpm install

# Setup Supabase
npx supabase init
npx supabase db push

# Run development server
pnpm dev

# Build for production
pnpm build

# Run migrations
npx supabase migration up

# Generate TypeScript types from database
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

## Testing Strategy

```
tests/
├── unit/              # Component and utility tests
├── integration/       # API and database tests
└── e2e/               # End-to-end user flows
```

## Monitoring & Analytics

- **Vercel Analytics** - Page views, Core Web Vitals
- **Sentry** (optional) - Error tracking
- **Supabase Dashboard** - Database queries, auth events

## Mobile-First Breakpoints

```javascript
// Tailwind breakpoints
sm: '640px',   // Mobile landscape
md: '768px',   // Tablet
lg: '1024px',  // Desktop
xl: '1280px',  // Large desktop
2xl: '1536px', // Extra large
```

## Component Reusability Guidelines

1. **UI Components** (`components/ui/`)
   - Atomic, highly reusable
   - No business logic
   - Style variants via props

2. **Feature Components**
   - Composed of UI components
   - Include business logic
   - Specific to use cases

3. **Page Components**
   - Route-specific
   - Compose feature components
   - Minimal logic

---

**Quick Start:**
1. Read full `ARCHITECTURE.md` for detailed specifications
2. Setup project with Next.js and Supabase
3. Run database migrations
4. Build core UI components
5. Implement authentication
6. Build pages following route structure
7. Deploy to Vercel

**For Questions:**
- Refer to full ARCHITECTURE.md document
- Check Supabase documentation
- Review Next.js App Router docs
