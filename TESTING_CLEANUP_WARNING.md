# ⚠️ Important: Testing and Cleanup

## The Problem You Just Hit

When testing authentication, you ran into this issue:

1. ✅ Registered → Created auth.users + participants
2. ✅ Got confirmation email
3. ❌ **Deleted auth.users manually** (before clicking confirmation)
4. ❌ Clicked confirmation link → Error: "User does not exist"

## Why This Happens

The confirmation link is tied to a specific user ID. When you delete the user but the confirmation token still exists:
- Supabase tries to activate a non-existent user
- Creates a JWT session for a ghost user
- Fails when trying to fetch user data

## ✅ Correct Way to Test

### Option 1: Complete the Full Flow (Recommended)

**Don't delete anything mid-flow!**

```bash
# 1. Register
open http://localhost:3000/pamelding
# Fill form → Submit

# 2. Check email immediately
# Click confirmation link right away

# 3. Complete the flow
# Should redirect to dashboard

# 4. THEN clean up if needed
```

### Option 2: Clean Up BEFORE Registration

**Delete BEFORE you register, not during:**

```sql
-- Clean up FIRST
DELETE FROM participants WHERE email = 'test@example.com';
DELETE FROM auth.users WHERE email = 'test@example.com';

-- THEN register with fresh start
```

### Option 3: Use Different Emails for Testing

```bash
# Test 1
test1@example.com

# Test 2
test2@example.com

# Test 3
test3@example.com

# Clean up all later
DELETE FROM participants WHERE email LIKE 'test%@example.com';
DELETE FROM auth.users WHERE email LIKE 'test%@example.com';
```

## ⚠️ Never Do This

```
❌ Register → Delete user → Click confirmation link
❌ Click old confirmation links after deleting users
❌ Delete users while they have pending confirmations
```

## ✅ Always Do This

```
✅ Register → Click confirmation → THEN delete if needed
✅ Use fresh email addresses for each test
✅ Complete the full flow before cleaning up
✅ Delete participants AND auth.users together
```

## Current Situation - How to Fix

You have a broken state. Here's how to fix it:

```sql
-- 1. Clean up everything completely
DELETE FROM participants WHERE email = 'your-email@example.com';
DELETE FROM auth.users WHERE email = 'your-email@example.com';

-- 2. Close your browser (clear cookies)

-- 3. Restart dev server
npm run dev

-- 4. Try registration again with FRESH EMAIL or complete the flow this time
```

## Testing Checklist

- [ ] Clean database before testing
- [ ] Use fresh email address
- [ ] Register
- [ ] Check email immediately
- [ ] Click confirmation link
- [ ] Complete flow to dashboard
- [ ] THEN clean up if needed

## Code Fix

I've updated the callback to handle this case:
- If user was deleted → Redirect to /pamelding with message
- Clear error message: "Your account was removed. Please register again."

## Summary

**The golden rule:** Complete the full authentication flow before deleting anything.

**For testing:** Use multiple email addresses instead of deleting and re-registering with the same email.

**Current fix:** The code now handles deleted users gracefully, but it's better to avoid this situation entirely.

## Ready to Test Again

```bash
# 1. Clean up completely
# Run SQL above

# 2. Close browser

# 3. Restart server
npm run dev

# 4. Register with email: test1@example.com

# 5. Check email, click link IMMEDIATELY

# 6. Should work! ✅
```
