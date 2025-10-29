# Quick Reference: Multi-Year Support

## TL;DR

The Barteløpet backend now supports multiple event years. All data is year-specific, edits are only allowed in November for the current year, and historical data is preserved.

---

## Key Files

### Database
- `supabase/migrations/20250101000005_add_event_year_support.sql` - Schema changes
- `supabase/migrations/20250101000006_update_rls_for_year_support.sql` - Security policies
- `supabase/migrations/20250101000007_migrate_existing_data_to_2024.sql` - Data migration

### Backend
- `lib/utils/event-year.ts` - Year logic functions
- `lib/utils/api-helpers.ts` - API utilities
- `lib/utils/use-event-year.ts` - React hooks
- `app/api/participants-year-example/route.ts` - API example

### Documentation
- `BACKEND_IMPLEMENTATION_SUMMARY.md` - Full summary
- `MULTI_YEAR_BACKEND_IMPLEMENTATION.md` - Detailed guide

---

## Quick Commands

### Get Current Year
```typescript
import { getCurrentEventYear } from '@/lib/utils/event-year';
const year = getCurrentEventYear();
```

### Check Edit Permission
```typescript
import { isYearEditable } from '@/lib/utils/event-year';
const canEdit = isYearEditable(2024);
```

### Use Year Hook (Frontend)
```typescript
import { useEventYear } from '@/lib/utils/use-event-year';

function Component() {
  const { eventYear, setEventYear, canEdit } = useEventYear();
  // ...
}
```

### Add Year to API Query
```typescript
import { getYearFromParams } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = getYearFromParams(searchParams);

  const { data } = await supabase
    .from('table')
    .select('*')
    .eq('event_year', year);
}
```

### Check Edit Permission in API
```typescript
import { checkEditPermission } from '@/lib/utils/api-helpers';

export async function PATCH(request: NextRequest, { params }) {
  const { data: resource } = await supabase
    .from('table')
    .select('event_year')
    .eq('id', params.id)
    .single();

  const editError = checkEditPermission(resource.event_year);
  if (editError) return editError;

  // proceed with update...
}
```

---

## Database Functions

```sql
-- Get current event year
SELECT get_current_event_year();

-- Check if in November
SELECT is_november_edit_window();

-- Check if year is editable
SELECT is_year_editable(2024);

-- Get participant history
SELECT * FROM get_participant_history('user-uuid');

-- View current year data
SELECT * FROM current_year_participants;
SELECT * FROM current_year_completions;
SELECT * FROM current_year_votes;
```

---

## Business Rules

| Action | When | Year |
|--------|------|------|
| View | Anytime | Any year |
| Create | Anytime | Current year only |
| Update | November only | Current year only |
| Delete | November only | Current year only |

---

## Year Logic

```
Current Month >= November → Current calendar year
Current Month < November → Previous calendar year

Examples:
- November 2024 → Year 2024
- December 2024 → Year 2024
- January 2025 → Year 2024 (showing last year's results)
- October 2025 → Year 2024
- November 2025 → Year 2025 (new event year starts)
```

---

## Common Patterns

### API Route Template

```typescript
import {
  getYearFromParams,
  validateYear,
  checkEditPermission,
  successResponse,
  errorResponse,
} from '@/lib/utils/api-helpers';
import { getCurrentEventYear } from '@/lib/utils/event-year';

// GET - with year filter
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = getYearFromParams(searchParams);
  const yearError = validateYear(year);
  if (yearError) return yearError;

  const { data } = await supabase
    .from('table')
    .select('*')
    .eq('event_year', year);

  return successResponse(data);
}

// POST - current year only
export async function POST(request: NextRequest) {
  const body = await request.json();
  const currentYear = getCurrentEventYear();

  const { data } = await supabase
    .from('table')
    .insert({ ...body, event_year: currentYear });

  return successResponse(data, undefined, 201);
}

// PATCH - with edit restrictions
export async function PATCH(request: NextRequest, { params }) {
  const { data: resource } = await supabase
    .from('table')
    .select('event_year')
    .eq('id', params.id)
    .single();

  const editError = checkEditPermission(resource.event_year);
  if (editError) return editError;

  const body = await request.json();
  const { data } = await supabase
    .from('table')
    .update(body)
    .eq('id', params.id);

  return successResponse(data);
}
```

### Frontend Component

```typescript
import { useEventYear } from '@/lib/utils/use-event-year';

export function YearSelector() {
  const {
    eventYear,
    setEventYear,
    availableYears,
    isCurrentYear,
    canEdit,
    editStatus
  } = useEventYear();

  return (
    <div>
      <select
        value={eventYear}
        onChange={(e) => setEventYear(parseInt(e.target.value))}
      >
        {availableYears.map((year) => (
          <option key={year} value={year}>
            Barteløpet {year}
          </option>
        ))}
      </select>

      {!isCurrentYear && (
        <p className="text-sm text-gray-600">
          Viser arkivert data for {eventYear}
        </p>
      )}

      {canEdit ? (
        <button>Rediger</button>
      ) : (
        <p className="text-sm text-gray-500">{editStatus}</p>
      )}
    </div>
  );
}
```

---

## Debugging

### Check Year Configuration

```sql
SELECT
  NOW() as current_time,
  EXTRACT(MONTH FROM NOW()) as current_month,
  get_current_event_year() as current_event_year,
  is_november_edit_window() as is_november;
```

### Check Data by Year

```sql
SELECT event_year, COUNT(*) as count
FROM participants
GROUP BY event_year
ORDER BY event_year DESC;
```

### Check User Registrations

```sql
SELECT event_year, email, full_name, bib_number
FROM participants
WHERE user_id = 'USER_UUID'
ORDER BY event_year DESC;
```

### Test Edit Permissions

```sql
SELECT
  id,
  event_year,
  get_current_event_year() as current_year,
  is_year_editable(event_year) as can_edit,
  CASE
    WHEN event_year = get_current_event_year() AND is_november_edit_window()
    THEN 'Kan redigere'
    WHEN event_year != get_current_event_year()
    THEN 'Arkivert - kan ikke redigere'
    ELSE 'Venter på november'
  END as status
FROM participants
LIMIT 10;
```

---

## Error Messages

### Norwegian User-Facing Messages

```typescript
// Year validation
'Ugyldig år' - Invalid year
'År må være mellom 2024 og 2100' - Year must be between 2024 and 2100

// Edit restrictions
'Redigering ikke tillatt' - Editing not allowed
'Kan kun redigere data for inneværende år' - Can only edit data for current year
'Utenfor redigeringsperiode' - Outside edit period
'Redigering er kun tillatt i november måned' - Editing only allowed in November

// Registration
'Allerede registrert' - Already registered
'Du er allerede registrert for [year]' - You're already registered for [year]

// General
'Ikke autorisert' - Unauthorized
'Ikke tilgang' - No access
'Fant ikke ressurs' - Resource not found
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Review migration scripts
- [ ] Backup production database
- [ ] Test migrations in dev/staging
- [ ] Verify existing data will migrate to 2024

### Deployment

- [ ] Run migration 005 (schema changes)
- [ ] Run migration 006 (RLS policies)
- [ ] Run migration 007 (data migration)
- [ ] Verify migrations completed successfully

### Post-Deployment

- [ ] Check `get_current_event_year()` returns correct year
- [ ] Verify all data has `event_year = 2024`
- [ ] Test API endpoints with year parameter
- [ ] Test edit restrictions work
- [ ] Monitor logs for errors

### Frontend Deployment

- [ ] Deploy utility functions
- [ ] Deploy year hooks
- [ ] Add year selector to UI
- [ ] Update data fetching
- [ ] Test user flows

---

## Need Help?

1. **Full Implementation Details**: See `MULTI_YEAR_BACKEND_IMPLEMENTATION.md`
2. **Complete Summary**: See `BACKEND_IMPLEMENTATION_SUMMARY.md`
3. **Database Issues**: Check migration scripts in `supabase/migrations/`
4. **API Issues**: Review `lib/utils/api-helpers.ts` and example route
5. **Frontend Issues**: Check `lib/utils/use-event-year.ts`

---

## Contact

For questions or issues during implementation, consult:
- Migration scripts for database details
- Implementation guide for business logic
- Example API route for patterns
- Type definitions for interfaces
