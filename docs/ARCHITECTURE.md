# Barteløpet - Architecture

## Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Database + Auth)
- **Redis** (Caching)

## Project Structure

```
app/                      # Next.js App Router
├── _components/         # App-wide components (navigation, etc)
├── _shared/            # Shared resources
│   ├── components/ui/  # UI components (buttons, cards, etc)
│   ├── lib/           # Utils, supabase client, validations
│   └── types/         # TypeScript types
│
├── [route]/           # Feature routes
│   ├── _components/   # Route-specific components
│   ├── _utils/       # Route-specific utilities
│   └── page.tsx      # Route page
│
├── actions/          # Server actions
├── api/             # API routes
├── layout.tsx       # Root layout
└── page.tsx        # Home page

contexts/           # React contexts (year-context)
docs/              # Documentation
public/           # Static assets
supabase/        # Database migrations
```

## Architecture Patterns

### 1. Colocation Pattern
Components live next to the routes that use them in `_components` folders. Truly shared code goes in `app/_shared`.

### 2. Server Components by Default
Pages are server components unless marked with `'use client'`. This enables server-side data fetching.

### 3. Server Actions
Database mutations use server actions in `app/actions/` for type-safe server-side operations.

### 4. Route Organization
Routes use Norwegian names matching the domain:
- `/deltakere` - Participants list
- `/galleri` - Photo gallery
- `/pamelding` - Registration
- `/send-inn` - Submit completion
- `/dashboard` - User dashboard

## Key Features

- **Multi-year support** via YearContext
- **OAuth authentication** (Google, Vipps)
- **Image uploads** to Supabase storage
- **Voting system** for gallery photos
- **Admin dashboard** for completion management

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Redis connection details
- Vipps OAuth credentials