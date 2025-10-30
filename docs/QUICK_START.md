# Quick Start Guide

## Prerequisites
- Node.js 18+
- pnpm or npm
- Supabase account

## Setup in 5 minutes

### 1. Clone and install
```bash
git clone <repository>
cd barteløpet
pnpm install
```

### 2. Setup environment
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 3. Minimum required environment variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Run database migrations
Apply all migrations in `supabase/migrations/` folder in order through your Supabase dashboard.

### 5. Start development
```bash
pnpm dev
```

Open http://localhost:3000

## Key Commands

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Run production build
pnpm lint       # Run linter
pnpm type-check # Check TypeScript
```

## Project Structure

```
app/        → Pages and API routes
features/   → Feature modules (vertical slices)
components/ → Reusable UI components
lib/        → Utilities and configurations
supabase/   → Database migrations
public/     → Static assets
```

## Need Help?
- See `/docs/setup/` for detailed setup guides
- See `/docs/architecture/` for architecture details
- Check README.md for full documentation