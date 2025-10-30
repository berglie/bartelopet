# Feature Module Template

This template provides the standard structure for a feature module in the vertical slices architecture.

## Directory Structure

```
features/
  [feature-name]/
    ├── components/         # Feature-specific UI components
    │   ├── ComponentA.tsx
    │   ├── ComponentB.tsx
    │   └── index.ts      # Export all components
    │
    ├── server/            # Server-side logic
    │   ├── actions.ts     # Server actions (mutations)
    │   ├── queries.ts     # Data fetching functions
    │   └── mutations.ts   # Data mutation functions
    │
    ├── api/               # API routes (if needed)
    │   └── route.ts       # Next.js API route handler
    │
    ├── hooks/             # Feature-specific React hooks
    │   ├── useFeatureA.ts
    │   └── useFeatureB.ts
    │
    ├── lib/               # Feature utilities
    │   ├── validations.ts # Zod schemas
    │   ├── constants.ts   # Feature constants
    │   └── utils.ts       # Feature utilities
    │
    ├── types/             # TypeScript types
    │   └── index.ts       # Feature types
    │
    └── index.ts           # Public API exports
```

## File Templates

### `index.ts` - Feature Public API
```typescript
/**
 * [Feature Name] Module
 *
 * [Brief description of what this feature does]
 */

// Components
export * from './components'

// Server functions (for server components)
export * from './server/queries'

// Types
export * from './types'

// Hooks (for client components)
export * from './hooks'

// Constants (if needed externally)
export { FEATURE_CONSTANTS } from './lib/constants'
```

### `components/index.ts`
```typescript
// Export all feature components
export { ComponentA } from './ComponentA'
export { ComponentB } from './ComponentB'
```

### `server/queries.ts`
```typescript
import { createServerClient } from '@shared/lib/supabase'
import type { FeatureData } from '../types'

export async function getFeatureData(): Promise<FeatureData[]> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('table_name')
    .select('*')

  if (error) throw error
  return data
}
```

### `server/actions.ts`
```typescript
'use server'

import { createServerClient } from '@shared/lib/supabase'
import { revalidatePath } from 'next/cache'
import { featureSchema } from '../lib/validations'

export async function createFeatureItem(formData: FormData) {
  const validatedData = featureSchema.parse({
    // parse form data
  })

  const supabase = await createServerClient()

  const { error } = await supabase
    .from('table_name')
    .insert(validatedData)

  if (error) throw error

  revalidatePath('/relevant-path')
}
```

### `lib/validations.ts`
```typescript
import { z } from 'zod'

export const featureSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  // ... other fields
})

export type FeatureInput = z.infer<typeof featureSchema>
```

### `types/index.ts`
```typescript
import type { BaseEntity } from '@shared/types'

export interface FeatureItem extends BaseEntity {
  name: string
  description?: string
  // ... other fields
}

export interface FeatureState {
  items: FeatureItem[]
  isLoading: boolean
  error?: string
}
```

### `hooks/useFeature.ts` (if needed for client components)
```typescript
'use client'

import { useState, useEffect } from 'react'
import type { FeatureItem } from '../types'

export function useFeature() {
  const [data, setData] = useState<FeatureItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Implementation...

  return { data, isLoading }
}
```

## Guidelines

1. **Keep features isolated**: Each feature should be self-contained
2. **Minimize external dependencies**: Only depend on shared module
3. **Clear public API**: Export only what's needed externally via index.ts
4. **Consistent naming**: Follow the naming conventions
5. **Type safety**: Always use TypeScript types
6. **Validation**: Use Zod for runtime validation
7. **Server-first**: Prefer server components and server actions
8. **Colocation**: Keep related code together

## Migration Checklist

When migrating an existing feature:

- [ ] Create feature directory structure
- [ ] Move feature-specific components
- [ ] Extract server logic (queries, mutations)
- [ ] Move/create validation schemas
- [ ] Define feature types
- [ ] Create feature constants
- [ ] Set up public API exports
- [ ] Update imports in app directory
- [ ] Test feature in isolation
- [ ] Remove old code locations
- [ ] Update documentation