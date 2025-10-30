# Vertical Slices Architecture - Barteløpet

This document describes the new vertical slices architecture implementation for the Barteløpet project.

## Overview

The project has been refactored from a traditional layered architecture to a vertical slices architecture, where each feature is self-contained with its own components, logic, and data access.

## Current Architecture Status

### ✅ Completed Migrations
- **Public Pages** - Static pages (privacy policy, terms of service)
- **Participants** - Participant listing and statistics

### 🚧 Pending Migrations
- Gallery - Photo gallery and viewing
- Authentication - Login, magic links, Vipps OAuth
- Registration - User registration flow
- Completions - Run submission and management
- Voting - Voting system
- Dashboard - User dashboard
- Comments - Photo commenting
- Year Management - Multi-year event support

## Project Structure

```
barteløpet/
├── app/                    # Next.js App Router (pages and routes)
├── features/              # Feature modules (vertical slices)
│   ├── shared/           # Shared infrastructure
│   │   ├── components/   # Shared UI components exports
│   │   ├── lib/         # Shared utilities and constants
│   │   └── types/       # Shared type definitions
│   ├── public-pages/    # Public pages feature
│   │   ├── components/  # Page components
│   │   └── lib/        # Page metadata
│   ├── participants/    # Participants feature
│   │   ├── components/  # UI components
│   │   ├── server/     # Data queries
│   │   └── types/      # Type definitions
│   └── [other-features]/
├── components/           # Legacy components (being migrated)
├── lib/                 # Core libraries (Supabase, utils)
└── types/               # Legacy types (being migrated)
```

## Feature Module Structure

Each feature follows this standard structure:

```
features/[feature-name]/
├── components/         # Feature-specific UI components
├── server/            # Server-side logic
│   ├── actions.ts     # Server actions (mutations)
│   └── queries.ts     # Data fetching
├── api/               # API routes (if needed)
├── hooks/             # React hooks (if needed)
├── lib/               # Feature utilities
│   ├── validations.ts # Zod schemas
│   └── constants.ts   # Feature constants
├── types/             # TypeScript types
└── index.ts          # Public API exports
```

## Import Guidelines

### Using Feature Modules

```typescript
// Import from feature modules using @ prefix
import { ParticipantsList, getParticipants } from '@/features/participants'
import { PrivacyPolicy } from '@/features/public-pages'
```

### Using Shared Infrastructure

```typescript
// Shared components and utilities are in the shared module
import { Button, Card } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
```

## Migration Process

When migrating a feature to vertical slices:

1. **Create feature directory** under `/features`
2. **Move components** to `features/[name]/components`
3. **Extract server logic** to `features/[name]/server`
4. **Move validations** to `features/[name]/lib/validations.ts`
5. **Define types** in `features/[name]/types`
6. **Create public API** in `features/[name]/index.ts`
7. **Update imports** in app directory pages
8. **Test feature** independently
9. **Remove old code** from legacy locations

## Benefits

1. **Feature Isolation** - Each feature is self-contained
2. **Clear Boundaries** - Explicit dependencies between features
3. **Better Maintainability** - Changes are localized to features
4. **Easier Testing** - Features can be tested independently
5. **Parallel Development** - Teams can work on different features

## Development Guidelines

### Adding a New Feature

1. Create directory under `/features/[feature-name]`
2. Follow the standard structure template
3. Export public API through `index.ts`
4. Import only from shared module or other features' public APIs

### Modifying an Existing Feature

1. All changes should be contained within the feature directory
2. Update the public API if needed
3. Ensure no breaking changes to consumers

### Cross-Feature Communication

- Features should communicate through their public APIs
- Avoid direct imports between feature internals
- Use events or shared state when needed

## Next Steps

1. Continue migrating remaining features
2. Set up proper webpack aliases for cleaner imports
3. Add feature-level testing
4. Document inter-feature dependencies
5. Create feature flags for gradual rollout

## Technical Debt

- Some imports still use relative paths instead of aliases
- Need to configure webpack for custom path aliases
- Legacy components still exist alongside new structure
- Type definitions are duplicated in some places

## Questions or Issues?

If you encounter any issues with the new architecture or have questions about migrating features, please refer to the FEATURE_TEMPLATE.md file or reach out to the development team.