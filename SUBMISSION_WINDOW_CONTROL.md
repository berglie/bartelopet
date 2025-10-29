# Submission Window Control Guide

The Barteløpet application now uses a **feature toggle** to control when users can submit and edit their runs, instead of being hardcoded to November only.

## Overview

The submission window is controlled by a `submission_window_open` boolean flag in the `settings` table. When `true`, users can:
- Register as participants
- Submit completions
- Edit their own data
- Vote and comment

When `false`, the application becomes read-only for the current year (historical years are always read-only).

---

## How to Control the Submission Window

### Option 1: Using Supabase SQL Editor (Recommended)

Go to your Supabase project → SQL Editor and run one of these commands:

#### Open the submission window:
```sql
SELECT open_submission_window();
```

#### Close the submission window:
```sql
SELECT close_submission_window();
```

#### Check current status:
```sql
SELECT submission_window_open, current_event_year, updated_at, updated_by
FROM settings
WHERE id = 1;
```

### Option 2: Direct SQL Update

```sql
-- Open window
UPDATE settings
SET submission_window_open = true,
    updated_at = NOW()
WHERE id = 1;

-- Close window
UPDATE settings
SET submission_window_open = false,
    updated_at = NOW()
WHERE id = 1;
```

---

## Managing Event Years

### Check current event year:
```sql
SELECT get_current_event_year();
```

### Set a new event year:
```sql
SELECT set_current_event_year(2026);
```

This is useful when you want to start accepting registrations for the next year.

---

## Understanding the System

### What happens when the window is OPEN:
- ✅ Users can register for the current event year
- ✅ Participants can submit their completion photos
- ✅ Participants can edit their submissions
- ✅ Users can vote and comment
- ✅ All CREATE, UPDATE, DELETE operations allowed for current year

### What happens when the window is CLOSED:
- ✅ Anyone can VIEW all data (all years)
- ❌ No new registrations
- ❌ No new submissions
- ❌ Cannot edit existing data
- ❌ The current year becomes read-only

### Historical years:
- Always read-only regardless of window status
- Cannot be edited even when submission window is open
- All data preserved and visible

---

## Typical Workflow

### Starting a new event (e.g., November 2025):

1. **Update the event year:**
   ```sql
   SELECT set_current_event_year(2025);
   ```

2. **Open the submission window:**
   ```sql
   SELECT open_submission_window();
   ```

3. **Announce to participants** that registration is open

### During the event:
- Keep the window **OPEN** throughout November (or longer if desired)
- Participants submit their runs as they complete them

### Closing registration:
```sql
SELECT close_submission_window();
```

### Extending the deadline:
If you want to give participants more time, just keep the window open past November:
```sql
-- Check status
SELECT * FROM settings WHERE id = 1;

-- Keep open or reopen
SELECT open_submission_window();
```

---

## Frontend Behavior

The frontend automatically:
- Checks the `settings.submission_window_open` flag
- Shows/hides submission forms based on status
- Displays informative messages when window is closed
- Disables edit buttons for read-only data

Users will see messages like:
- **When open:** "Du kan redigere oppføringer for 2025"
- **When closed:** "Redigeringsvinduet er stengt. Kontakt arrangør for å åpne det."
- **Historical years:** "Dataene for 2024 er arkivert og kan ikke endres."

---

## Security

The database RLS (Row Level Security) policies enforce the submission window at the database level, so even if someone tries to bypass the frontend, they cannot:
- Insert data when the window is closed
- Update data when the window is closed
- Delete data when the window is closed
- Edit historical years at any time

The frontend check is for UX only - the real security is in the database.

---

## Monitoring

### View all settings:
```sql
SELECT * FROM settings;
```

### View recent changes:
```sql
SELECT submission_window_open, updated_at, updated_by
FROM settings
WHERE id = 1;
```

### Check how many submissions in current year:
```sql
SELECT COUNT(*) as submission_count
FROM completions
WHERE event_year = get_current_event_year();
```

---

## Troubleshooting

### Problem: Users can't submit even though window is open

**Check:**
1. Verify window is actually open:
   ```sql
   SELECT submission_window_open FROM settings WHERE id = 1;
   ```

2. Verify they're submitting for current year:
   ```sql
   SELECT current_event_year FROM settings WHERE id = 1;
   ```

3. Check browser console for errors

### Problem: Need to allow edits outside the normal window

**Solution:** Simply open the window manually:
```sql
SELECT open_submission_window();
```

You have full control - no need to wait for November!

---

## Migration Notes

When you first deploy the new feature toggle migration (`20250101000008_add_feature_toggle.sql`):
- The `settings` table will be created
- `submission_window_open` defaults to `true` (open)
- `current_event_year` defaults to `2025`

This means submissions will be enabled immediately after migration. If you want it closed, run:
```sql
SELECT close_submission_window();
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `SELECT open_submission_window();` | Allow submissions |
| `SELECT close_submission_window();` | Block submissions |
| `SELECT set_current_event_year(2026);` | Change event year |
| `SELECT * FROM settings WHERE id = 1;` | Check status |
| `SELECT get_current_event_year();` | Get current year |
| `SELECT is_submission_window_open();` | Check if open |

---

## Tips

1. **Open early, close late**: There's no harm in keeping the window open longer
2. **Test before announcing**: Open window → test submission → verify → announce
3. **Close gradually**: Consider sending reminder emails before closing
4. **Document changes**: The `updated_by` field tracks who made changes
5. **Backup before changes**: Always good practice when running SQL

---

## Questions?

This feature toggle gives you complete control over when users can interact with the system. No more waiting for November - you decide when registration opens and closes!
