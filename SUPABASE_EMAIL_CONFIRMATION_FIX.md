# Fix Email Confirmation Issue

## Problem

You're getting a "Confirm your signup" email instead of a magic link, and the confirmation link doesn't work with your callback.

## Why This Happens

Supabase has **Email Confirmation** enabled by default. When you register:
1. Registration creates a participant record
2. Sends magic link via `signInWithOtp`
3. BUT Supabase sees this as a new signup → sends confirmation email instead
4. Confirmation email has format: `?token=xxx&type=signup`
5. Your callback expected: `?token_hash=xxx&type=magiclink`
6. → Error: "Invalid or expired link"

## Solution Options

### Option 1: Disable Email Confirmation (Easiest for Development)

**Go to Supabase Dashboard:**

1. **Navigate to Settings**
   - Authentication → Settings → Email Auth

2. **Disable Email Confirmation**
   - Find: "Enable email confirmations"
   - Toggle it **OFF** (disable)
   - Click **Save**

3. **Test Again**
   ```bash
   # Delete your test user first
   # Then try registration again
   open http://localhost:3000/pamelding
   ```

**Pros:** Simple, works immediately
**Cons:** Less secure (no email verification) - only use for development

### Option 2: Use the Updated Callback (Already Fixed!)

I've updated your callback to handle both formats:
- ✅ Magic link format: `?token_hash=xxx&type=magiclink`
- ✅ Confirmation format: `?token=xxx&type=signup`

**Just click the confirmation link again and it should work now!**

### Option 3: Fix Registration to Use Signup (Proper Way)

Update the registration form to use `signUp` instead of `signInWithOtp`:

```typescript
// In components/registration-form.tsx, replace the magic link section:

// BEFORE (line 110-117):
await supabase.auth.signInWithOtp({
  email: data.email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});

// AFTER:
const { error: signUpError } = await supabase.auth.signUp({
  email: data.email,
  password: crypto.randomUUID(), // Generate random password (user won't use it)
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
    data: {
      full_name: data.full_name,
    },
  },
});

if (signUpError) {
  console.error('Signup error:', signUpError);
}
```

This creates a proper auth user with email confirmation.

## Recommended Solution for You

**For now (development):**
- Use **Option 1** (disable email confirmation)
- This lets you test quickly

**For production:**
- Use **Option 3** (proper signup flow)
- Keep email confirmation enabled for security

## Quick Fix Right Now

1. **Option A: Disable Email Confirmation** (recommended)
   ```
   Supabase Dashboard → Authentication → Settings → Email Auth
   → Disable "Enable email confirmations"
   → Save
   ```

2. **Option B: Try the confirmation link again**
   - I've fixed the callback code
   - Click the "Confirm your mail" link in your email again
   - Should work now! ✅

3. **Clean up and try again:**
   ```sql
   -- Delete test user
   DELETE FROM participants WHERE email = 'your-email@example.com';
   DELETE FROM auth.users WHERE email = 'your-email@example.com';

   -- Register again
   ```

## After Fix - Testing

```bash
# Start fresh
npm run dev

# Go to registration
open http://localhost:3000/pamelding

# Fill in form
# Check email
# Click link
# Should work! ✅
```

## Debug the Current Issue

If you want to see what's happening:

1. **Check your terminal** (where npm run dev is running)
   - Look for `=== AUTH CALLBACK ===`
   - You should see the URL and token info

2. **The link format you're getting:**
   ```
   https://xxx.supabase.co/auth/v1/verify?token=pkce_xxx&type=signup&redirect_to=...
   ```

3. **This gets redirected to your callback as:**
   ```
   http://localhost:3000/auth/callback?token=pkce_xxx&type=signup
   ```

4. **The updated callback now handles this!**

## Summary

**Immediate fix:** Go to Supabase Dashboard and disable email confirmations

**Or:** Click the confirmation link again - the updated code should handle it now

**For production:** Keep confirmations enabled and update registration to use proper `signUp` method

Let me know which option you want to go with!
