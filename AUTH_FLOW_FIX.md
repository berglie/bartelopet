# Auth Flow Fix - Registration and Login

## What Was Fixed

### The Problem
1. You clicked "Logg inn" → Created auth user but NO participant record
2. Magic link logged you in → Redirected to `/pamelding` (registration)
3. Tried to fill form → **ERROR:** "Email already exists"

### The Solution
I've fixed the flow to handle both scenarios:

1. **Normal Registration Flow** (recommended):
   - Go to `/pamelding` → Fill form → Get magic link → Click link → Dashboard

2. **Login First Flow** (what you did):
   - Go to `/login` → Get magic link → Click link → Redirected to `/pamelding` → Fill form → Dashboard

## What Changed

### 1. Updated Registration Form (`components/registration-form.tsx`)
- Now checks if user is already authenticated
- If authenticated: Links participant record to existing auth user
- If not authenticated: Creates participant and sends magic link

### 2. Updated Auth Callback (`app/auth/callback/route.ts`)
- Now links participant records to auth users by email
- Redirects to `/pamelding` if no participant record exists
- Redirects to dashboard if participant record exists

### 3. Updated Login Page (`app/login/page.tsx`)
- Added clear messaging that you must register first
- Better error handling
- Clearer instructions

## How to Test (Fix Your Current Situation)

### Option 1: Clean Slate (Recommended)

Since you have a half-created account, let's clean it up:

```sql
-- 1. Connect to your Supabase database (via Dashboard SQL Editor)

-- 2. Find your auth user
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 3. Delete the auth user (this will cascade delete sessions)
DELETE FROM auth.users WHERE email = 'your-email@example.com';

-- 4. Delete any orphaned participant records
DELETE FROM participants WHERE email = 'your-email@example.com';

-- 5. Verify cleanup
SELECT * FROM auth.users WHERE email = 'your-email@example.com';
SELECT * FROM participants WHERE email = 'your-email@example.com';
-- Both should return no results
```

Then start fresh:
```bash
# Go to registration page
open http://localhost:3000/pamelding

# Fill in the form completely
# You'll get a bib number and magic link
# Click magic link → Dashboard ✅
```

### Option 2: Complete Your Current Registration

The updated code should now work with your half-created account:

```bash
# 1. Make sure you're logged in (you should be if you clicked the magic link)
# Check: http://localhost:3000/dashboard - does it redirect to /pamelding?

# 2. If yes, you're on /pamelding - fill in the form
# The form will now link your participant record to your existing auth user

# 3. Submit → Should work! ✅
```

## Complete Testing Flow

### Test 1: Normal Registration (New User)

```bash
# 1. Start fresh (logout if needed)
npm run dev

# 2. Go to registration
open http://localhost:3000/pamelding

# 3. Fill in form:
#    - Full name: Test User
#    - Email: test1@example.com
#    - Address: Test Address
#    - Phone: 12345678

# 4. Submit → Should see bib number

# 5. Check email for magic link

# 6. Click magic link → Should redirect to /dashboard ✅
```

### Test 2: Login (Returning User)

```bash
# 1. Logout first (or use private browsing)

# 2. Go to login
open http://localhost:3000/login

# 3. Enter your registered email

# 4. Click "Send innloggingslenke"

# 5. Check email, click link

# 6. Should redirect to /dashboard ✅
```

### Test 3: Login Before Registration (Edge Case)

```bash
# 1. Start fresh (new email that's not registered)

# 2. Go to login (don't register first)
open http://localhost:3000/login

# 3. Enter new email: test2@example.com

# 4. Click magic link in email

# 5. Should redirect to /pamelding (registration page)

# 6. Fill in form with same email

# 7. Submit → Should work and redirect to /dashboard ✅
```

## Debug Mode

Check your terminal where `npm run dev` is running. You'll see helpful logs:

```bash
# When clicking magic link:
=== AUTH CALLBACK ===
URL: http://localhost:3000/auth/callback?token_hash=...
token_hash: present
type: magiclink
✅ Auth successful
🔗 Linking participant to auth user  # (if needed)
✅ Redirecting to: /dashboard

# Or:
ℹ️ No participant record, redirecting to registration
```

## Common Issues

### Issue: "Email already exists"
**Cause:** Half-created account from before the fix
**Solution:** Use Option 1 above (clean slate) or just submit the form again (should work now)

### Issue: Still redirected to /pamelding after registration
**Cause:** Participant record wasn't created successfully
**Solution:** Check browser console and terminal logs for errors

### Issue: Magic link doesn't work
**Cause:** Email template not updated in Supabase
**Solution:** Follow `SUPABASE_EMAIL_FIX.md` guide

### Issue: Can't access dashboard
**Cause:** No participant record linked to auth user
**Solution:**
```sql
-- Check linking
SELECT u.email, p.full_name, p.user_id
FROM auth.users u
LEFT JOIN participants p ON p.user_id = u.id
WHERE u.email = 'your-email@example.com';

-- If user_id is NULL, link it manually:
UPDATE participants
SET user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com')
WHERE email = 'your-email@example.com';
```

## Database Schema Check

Your participants table should have these columns:

```sql
-- Check schema
\d participants

-- Should include:
-- - id (uuid, primary key)
-- - user_id (uuid, foreign key to auth.users, nullable)
-- - email (text, unique)
-- - full_name (text)
-- - postal_address (text)
-- - phone_number (text, nullable)
-- - bib_number (integer, unique)
-- - created_at, updated_at (timestamptz)
```

## Flow Diagram

```
NEW USER (Recommended Flow):
┌─────────────┐
│ /pamelding  │ Register
└──────┬──────┘
       │ Fill form
       ▼
┌─────────────────┐
│ Create          │
│ participant     │
│ (no user_id)    │
└──────┬──────────┘
       │ Send magic link
       ▼
┌─────────────────┐
│ Click email     │
│ link            │
└──────┬──────────┘
       │ verifyOtp()
       ▼
┌─────────────────┐
│ Create          │
│ auth.users      │
└──────┬──────────┘
       │ Link participant
       ▼
┌─────────────────┐
│ /dashboard ✅   │
└─────────────────┘


RETURNING USER:
┌─────────────┐
│ /login      │
└──────┬──────┘
       │ Enter email
       ▼
┌─────────────────┐
│ Send magic link │
└──────┬──────────┘
       │ Click link
       ▼
┌─────────────────┐
│ verifyOtp()     │
└──────┬──────────┘
       │ Check participant
       ▼
┌─────────────────┐
│ /dashboard ✅   │
└─────────────────┘


LOGIN BEFORE REGISTER (Edge Case):
┌─────────────┐
│ /login      │
└──────┬──────┘
       │ New email
       ▼
┌─────────────────┐
│ Click link      │
└──────┬──────────┘
       │ verifyOtp()
       ▼
┌─────────────────┐
│ No participant  │
│ found           │
└──────┬──────────┘
       │ Redirect
       ▼
┌─────────────────┐
│ /pamelding      │
│ (complete       │
│  profile)       │
└──────┬──────────┘
       │ Fill form
       ▼
┌─────────────────┐
│ Link participant│
│ to auth user    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ /dashboard ✅   │
└─────────────────┘
```

## Summary

The auth flow now gracefully handles:
- ✅ Normal registration → magic link → dashboard
- ✅ Login with existing account → dashboard
- ✅ Login before registration → complete profile → dashboard
- ✅ Automatic linking of participant records to auth users
- ✅ Clear error messages and user guidance

**Your issue is now fixed!** Just follow Option 1 or 2 above to complete your registration.
