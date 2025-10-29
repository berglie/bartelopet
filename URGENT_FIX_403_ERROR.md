# URGENT: Fix 403 Permission Error on Google OAuth Registration

## Problem Summary

Users see "Det oppstod en tilgangsfeil" (403 Forbidden) when registering via Google OAuth. The error occurs when the registration form tries to fetch the maximum bib number:

```
GET /rest/v1/participants?select=bib_number&order=bib_number.desc&limit=1 403 (Forbidden)
Error: {code: '42501', details: null, hint: null, message: 'permission denied for table participants'}
```

## Root Cause

**The new RLS migrations (007 and 008) have NOT been applied to the production database.**

Evidence:
- Git shows migrations were renamed (006→008, 008→007)
- The old RLS policies don't allow the SELECT query
- The new policies (migration 008) use `USING (true)` which should work

## Immediate Fix Required

### Option 1: Apply Migrations (Recommended)

The migrations need to be applied to the database:

```bash
# If you have Supabase CLI installed
supabase db push

# Or through Supabase Dashboard:
# 1. Go to https://supabase.com/dashboard/project/{your-project}/database/migrations
# 2. Upload the two migration files:
#    - 20250101000007_add_feature_toggle.sql
#    - 20250101000008_update_rls_for_year_support.sql
# 3. Apply them in order
```

**CRITICAL**: These migrations MUST be applied in order:
1. **007 first** - Creates `settings` table and functions
2. **008 second** - Creates RLS policies that use those functions

### Option 2: Manual SQL Fix (Quick Workaround)

If migrations can't be applied immediately, run this SQL in Supabase SQL Editor:

```sql
-- Temporarily allow public SELECT on participants
DROP POLICY IF EXISTS "Public can view participants" ON participants;
CREATE POLICY "Public can view all participants (temp fix)"
  ON participants FOR SELECT
  USING (true);

-- Grant table permissions explicitly
GRANT SELECT ON participants TO anon, authenticated;
```

### Option 3: Code Fix (Workaround - Not Recommended)

Change the registration form to handle missing bib numbers:

```typescript
// In registration-form.tsx around line 71
const { data: maxBib, error: maxBibError } = await supabase
  .from('participants')
  .select('bib_number')
  .order('bib_number', { ascending: false })
  .limit(1)
  .maybeSingle(); // ← Changed from .single()

// Handle case where query is blocked
if (maxBibError) {
  console.error('Max bib error:', maxBibError);
  // Use a fallback bib number or fetch from a server action
  const nextBibNumber = 1; // Or implement server-side fetching
} else {
  const nextBibNumber = maxBib ? maxBib.bib_number + 1 : 1;
}
```

## Why This Happened

1. **Migration files were renamed** from the old numbering to new numbering
2. **Old migrations (006, 008) were never applied** to production
3. **New migrations (007, 008) haven't been applied yet**
4. **Database still has the original RLS policies** from migration 001, which may be more restrictive

## Verification Steps

After applying the fix, verify:

1. **Check migrations are applied**:
   ```sql
   SELECT version, name
   FROM supabase_migrations.schema_migrations
   WHERE version IN ('20250101000007', '20250101000008')
   ORDER BY version;
   ```

2. **Check settings table exists**:
   ```sql
   SELECT * FROM settings WHERE id = 1;
   ```
   Should return: `{ id: 1, submission_window_open: true, current_event_year: 2025, ... }`

3. **Check RLS policies**:
   ```sql
   SELECT policyname, cmd, qual
   FROM pg_policies
   WHERE tablename = 'participants'
   AND cmd = 'SELECT';
   ```
   Should show: `"Public can view all participants (all years)" | SELECT | true`

4. **Test the exact failing query**:
   ```sql
   -- This should work now (as anon user)
   SET ROLE anon;
   SELECT bib_number FROM participants ORDER BY bib_number DESC LIMIT 1;
   RESET ROLE;
   ```

## Testing After Fix

1. Log out completely
2. Click "Logg inn med Google"
3. Complete OAuth flow
4. Fill registration form
5. Click "Meld meg på"
6. Should **NOT** see "Det oppstod en tilgangsfeil"
7. Should redirect to dashboard with new bib number

## Additional Notes

- The `event_year` column has a default value of 2025, so INSERTs will work even if the app doesn't specify it
- However, it's recommended to update the registration form to explicitly set `event_year: 2025` for clarity
- The submission window feature toggle is set to `true` by default in the settings table

## Files Involved

- `/home/stian/Repos/barteløpet/supabase/migrations/20250101000007_add_feature_toggle.sql`
- `/home/stian/Repos/barteløpet/supabase/migrations/20250101000008_update_rls_for_year_support.sql`
- `/home/stian/Repos/barteløpet/components/registration-form.tsx` (line 71-88)

## Status

- ✅ Root cause identified
- ✅ Fix documented
- ⏳ Migrations need to be applied
- ⏳ Verification needed after deployment
