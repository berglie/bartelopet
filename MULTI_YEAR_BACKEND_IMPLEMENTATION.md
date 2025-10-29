# Multi-Year Backend Implementation Guide

## Overview

This document describes the backend implementation for supporting multiple event years in the Barteløpet application. The system allows historical data preservation while maintaining year-specific operations and November-only edit windows.

---

## Architecture Summary

### Core Concepts

1. **Event Year**: Each registration, completion, vote, and comment belongs to a specific event year
2. **Current Year Logic**: Determined by date - November onwards = current year, before November = previous year
3. **Edit Window**: November is the only month when edits are allowed for the current year
4. **Data Isolation**: Each year's data is independent but queryable across years

### Key Design Decisions

- All main tables (`participants`, `completions`, `votes`, `photo_comments`) include `event_year` column
- Database functions handle year logic consistently
- RLS policies enforce year-based access control
- API routes filter by year
- November-only editing enforced at database and API level

---

## Database Changes

### Migration Files

#### 1. `20250101000005_add_event_year_support.sql`

Adds event_year support to all tables:

- Adds `event_year` column to all tables (default: 2024)
- Creates year-specific indexes for performance
- Updates unique constraints to be year-aware
- Creates helper functions for year operations
- Updates triggers to be year-aware
- Creates views for current year data

Key functions created:
- `get_current_event_year()`: Returns current event year based on date
- `is_november_edit_window()`: Checks if we're in November
- `is_year_editable(year)`: Checks if a year can be edited
- `validate_completion_date_year()`: Validates completion dates
- `get_participant_history(user_id)`: Returns participation across years

#### 2. `20250101000006_update_rls_for_year_support.sql`

Updates RLS policies to be year-aware:

- Read access: All years visible to public
- Create access: Current year only
- Update/Delete access: Current year + November only
- Policies ensure data isolation between years

#### 3. `20250101000007_migrate_existing_data_to_2024.sql`

Migrates existing data to year 2024:

- Sets all existing records to `event_year = 2024`
- Validates data integrity
- Provides migration summary report

---

## TypeScript Types

### Updated Type Definitions

All main interfaces now include `event_year`:

```typescript
// Participant
export interface Participant {
  // ... other fields
  event_year: number;
}

// Completion
export interface Completion {
  // ... other fields
  event_year: number;
}

// Vote
export interface Vote {
  // ... other fields
  event_year: number;
}

// PhotoComment
export interface PhotoComment {
  // ... other fields
  event_year: number;
}
```

### New Types

**ParticipantHistory**: For displaying user participation across years

```typescript
export interface ParticipantHistory {
  event_year: number;
  participant_id: string;
  email: string;
  full_name: string;
  bib_number: number;
  has_completed: boolean;
  registration_date: string;
  completion_date: string | null;
  vote_count: number;
}
```

---

## Utility Functions

### Event Year Utilities (`lib/utils/event-year.ts`)

Core functions for year management:

```typescript
// Get current event year (Nov+ = current year, before = last year)
getCurrentEventYear(): number

// Check if we're in November (edit window)
isNovemberEditWindow(): boolean

// Check if a specific year is editable
isYearEditable(year: number): boolean

// Get all available years (2024 to current)
getAvailableEventYears(): number[]

// Validate year is in valid range
isValidEventYear(year: number): boolean

// Validate completion date matches year and is in November
validateCompletionDate(date, eventYear): { isValid, error? }

// Check permissions for year-based operations
checkYearPermission(resourceYear, action): { canPerform, reason? }
```

### API Helper Functions (`lib/utils/api-helpers.ts`)

Utilities for API routes:

```typescript
// Extract year from query params or use current
getYearFromParams(searchParams): number

// Validate year parameter
validateYear(year): NextResponse | null

// Check edit permission for year
checkEditPermission(year): NextResponse | null

// Standard response builders
successResponse(data, meta?, status?): NextResponse
errorResponse(error, details?, status?): NextResponse
paginatedResponse(data, total, page, perPage): NextResponse

// Query helpers
getPaginationParams(searchParams): { page, perPage, from, to }
getSortParams(searchParams, defaultSortBy, defaultOrder): { sortBy, ascending }
withYearFilter(query, year): query

// Validation
validateRequiredFields(body, requiredFields): NextResponse | null
handleSupabaseError(error): NextResponse
```

---

## API Route Updates

### General Pattern for Year-Aware Routes

All API routes should follow this pattern:

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  getYearFromParams,
  validateYear,
  checkEditPermission,
  successResponse,
  errorResponse,
  getPaginationParams,
} from '@/lib/utils/api-helpers';
import { getCurrentEventYear } from '@/lib/utils/event-year';

// GET - List resources with year filter
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const supabase = createRouteHandlerClient({ cookies });

  // Get year from params or use current
  const year = getYearFromParams(searchParams);

  // Validate year
  const yearError = validateYear(year);
  if (yearError) return yearError;

  // Get pagination
  const { page, perPage, from, to } = getPaginationParams(searchParams);

  try {
    const { data, error, count } = await supabase
      .from('table_name')
      .select('*', { count: 'exact' })
      .eq('event_year', year)  // Year filter
      .range(from, to);

    if (error) throw error;

    return paginatedResponse(data || [], count || 0, page, perPage);
  } catch (error) {
    return handleSupabaseError(error);
  }
}

// POST - Create resource (current year only)
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return errorResponse('Unauthorized', undefined, 401);
  }

  try {
    const body = await request.json();

    // Validate required fields
    const validationError = validateRequiredFields(body, ['required_field']);
    if (validationError) return validationError;

    // Use current year
    const currentYear = getCurrentEventYear();

    const { data, error } = await supabase
      .from('table_name')
      .insert({
        ...body,
        event_year: currentYear,  // Always current year
      })
      .select()
      .single();

    if (error) throw error;

    return successResponse(data, undefined, 201);
  } catch (error) {
    return handleSupabaseError(error);
  }
}

// PATCH - Update resource (current year + November only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return errorResponse('Unauthorized', undefined, 401);
  }

  try {
    // Get resource to check its year
    const { data: resource } = await supabase
      .from('table_name')
      .select('event_year, user_id')
      .eq('id', params.id)
      .single();

    if (!resource) {
      return errorResponse('Not found', undefined, 404);
    }

    // Check edit permission for the year
    const editError = checkEditPermission(resource.event_year);
    if (editError) return editError;

    // Ownership check
    if (resource.user_id !== user.id) {
      return errorResponse('Forbidden', undefined, 403);
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from('table_name')
      .update(body)
      .eq('id', params.id)
      .eq('event_year', resource.event_year)  // Year safety check
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  } catch (error) {
    return handleSupabaseError(error);
  }
}
```

### Specific Route Examples

#### GET /api/participants?year=2024

Returns participants for specified year (or current if not specified).

#### GET /api/completions?year=2024

Returns completions for specified year.

#### GET /api/participants/[id]/history

Returns participation history across all years for a user.

#### POST /api/completions

Creates completion for current year only.

#### PATCH /api/completions/[id]

Updates completion - only allowed for current year during November.

---

## Database Views

### Current Year Views

Pre-filtered views for common queries:

```sql
-- Current year participants
CREATE VIEW current_year_participants AS
SELECT * FROM participants
WHERE event_year = get_current_event_year();

-- Current year completions
CREATE VIEW current_year_completions AS
SELECT c.*, p.full_name, p.email, p.bib_number
FROM completions c
JOIN participants p ON c.participant_id = p.id
WHERE c.event_year = get_current_event_year();

-- Current year votes
CREATE VIEW current_year_votes AS
SELECT v.*, p.full_name as voter_name
FROM votes v
JOIN participants p ON v.voter_id = p.id
WHERE v.event_year = get_current_event_year();
```

---

## Business Rules

### Year Assignment

1. **New Records**: Always use `getCurrentEventYear()` for new records
2. **Explicit Year**: API accepts optional `event_year` parameter but should validate it
3. **Default Behavior**: If no year specified, use current year

### Edit Restrictions

1. **View**: All years visible to everyone
2. **Create**: Current year only
3. **Update**: Current year + November only
4. **Delete**: Current year + November only

### Data Integrity

1. **Completions**: Must be dated in November of their event year
2. **Votes**: Must reference completion from same year
3. **Comments**: Must reference completion from same year
4. **Participants**: Can register once per year (same user, multiple years OK)

---

## Testing Checklist

### Database Tests

- [ ] Verify all tables have `event_year` column
- [ ] Check unique constraints are year-aware
- [ ] Test `get_current_event_year()` function with different dates
- [ ] Test `is_november_edit_window()` function
- [ ] Verify triggers properly filter by year
- [ ] Test RLS policies for different scenarios

### API Tests

- [ ] GET endpoints filter by year correctly
- [ ] POST endpoints use current year
- [ ] PATCH endpoints reject edits outside November
- [ ] PATCH endpoints reject edits for past years
- [ ] Year validation rejects invalid years
- [ ] Historical data queries work correctly

### Integration Tests

- [ ] User can view past years' data
- [ ] User can register for current year
- [ ] User cannot register twice for same year
- [ ] User can update registration in November
- [ ] User cannot update registration outside November
- [ ] Completions validate date is in November
- [ ] Votes respect year boundaries

---

## Frontend Integration

### Year Selection Component

Create a year selector component that:

1. Shows available years (2024 to current)
2. Defaults to current year
3. Updates URL params when changed
4. Triggers data refetch on change

```typescript
// Example hook
function useEventYear() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const eventYear = parseInt(
    searchParams.get('year') || getCurrentEventYear().toString(),
    10
  );

  const setEventYear = (year: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('year', year.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return { eventYear, setEventYear };
}
```

### Edit Permission Checks

Before showing edit buttons:

```typescript
import { isYearEditable, checkYearPermission } from '@/lib/utils/event-year';

function CompletionCard({ completion }) {
  const canEdit = isYearEditable(completion.event_year);
  const { canPerform, reason } = checkYearPermission(
    completion.event_year,
    'update'
  );

  return (
    <div>
      {/* ... content ... */}
      {canEdit && (
        <button onClick={handleEdit}>Rediger</button>
      )}
      {!canEdit && reason && (
        <p className="text-sm text-gray-500">{reason}</p>
      )}
    </div>
  );
}
```

---

## Deployment Steps

### 1. Backup Database

```bash
# Create backup before migration
pg_dump your_database > backup_before_year_support.sql
```

### 2. Run Migrations

```bash
# Apply migrations in order
psql your_database < supabase/migrations/20250101000005_add_event_year_support.sql
psql your_database < supabase/migrations/20250101000006_update_rls_for_year_support.sql
psql your_database < supabase/migrations/20250101000007_migrate_existing_data_to_2024.sql
```

### 3. Verify Data

```sql
-- Check migration summary
SELECT event_year, COUNT(*) as count
FROM participants
GROUP BY event_year;

SELECT event_year, COUNT(*) as count
FROM completions
GROUP BY event_year;

-- Verify current year function
SELECT get_current_event_year();

-- Verify edit window function
SELECT is_november_edit_window();
```

### 4. Deploy Backend Code

1. Deploy updated TypeScript types
2. Deploy utility functions
3. Deploy updated API routes
4. Test API endpoints

### 5. Deploy Frontend Changes

1. Deploy year selector component
2. Update data fetching to include year
3. Update forms to handle year
4. Test user flows

### 6. Monitor

- Watch for errors in API logs
- Monitor database performance
- Check RLS policy hits
- Verify edit restrictions working

---

## Troubleshooting

### Common Issues

**Issue**: Users can't edit their data
- **Check**: Is it November?
- **Check**: Are they editing current year's data?
- **Check**: Do RLS policies allow the operation?

**Issue**: Duplicate bib numbers across years
- **Solution**: This is expected - bib numbers are unique per year

**Issue**: Can't create records
- **Check**: Is `event_year` being set correctly?
- **Check**: Are you using current year?

**Issue**: Past year data not visible
- **Check**: Is year parameter being passed to API?
- **Check**: Are RLS policies too restrictive?

### Debug Queries

```sql
-- Check current year logic
SELECT
  NOW() as current_date,
  EXTRACT(MONTH FROM NOW()) as current_month,
  get_current_event_year() as current_event_year,
  is_november_edit_window() as is_november;

-- Check participant years
SELECT
  event_year,
  COUNT(*) as count,
  COUNT(CASE WHEN has_completed THEN 1 END) as completed
FROM participants
GROUP BY event_year
ORDER BY event_year DESC;

-- Check if user has multiple year registrations
SELECT
  user_id,
  email,
  event_year,
  bib_number
FROM participants
WHERE user_id = 'user-id-here'
ORDER BY event_year DESC;
```

---

## Future Enhancements

### Potential Improvements

1. **Admin Dashboard**: View/edit any year regardless of November
2. **Year Rollover Automation**: Auto-create next year's structure
3. **Historical Statistics**: Aggregate stats across years
4. **Year Comparison**: Compare performance across years
5. **Archive Old Years**: Move old years to archive tables for performance

### Database Optimizations

1. **Partitioning**: Partition tables by event_year for large datasets
2. **Materialized Views**: Cache year-based aggregations
3. **Archive Strategy**: Archive years older than 3 years

---

## Support

For questions or issues:

1. Check this documentation
2. Review migration scripts for details
3. Test in development environment first
4. Check database function implementations
5. Verify RLS policies are correct

---

## Change Log

- **2025-01-01**: Initial multi-year support implementation
  - Added event_year to all tables
  - Created year-aware RLS policies
  - Implemented utility functions
  - Migrated existing data to 2024
