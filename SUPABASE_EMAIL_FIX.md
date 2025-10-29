# Fix Supabase Magic Link Authentication

## Problem

When users click the magic link in their email, they are redirected back to the login page instead of being logged in.

## Root Cause

The Supabase email template is using the wrong URL format. It needs to include the `token_hash` and `type` parameters for the auth callback to work properly.

## Solution

### Option 1: Update Supabase Email Template (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: **barteløpet**

2. **Update Email Template**
   - Go to: **Authentication** → **Email Templates**
   - Select: **Magic Link**

3. **Replace the Email Template HTML**

Replace the default template with this:

```html
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink">Log In</a></p>
```

**Important:** Make sure `.SiteURL` is set correctly:
- Go to **Authentication** → **URL Configuration**
- Set **Site URL** to: `http://localhost:3000` (for development)
- Add **Redirect URLs**:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/dashboard`
  - `https://your-production-domain.com/auth/callback` (for production)

### Option 2: Update the Auth Callback Route (Alternative)

If you can't change the email template, update the callback route to handle both old and new formats:

**File:** `/home/stian/Repos/barteløpet/app/auth/callback/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';

  // Handle both formats: ?token_hash=xxx&type=magiclink OR ?token=xxx (legacy)
  const legacyToken = searchParams.get('token');

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // Redirect to dashboard after successful login
      return NextResponse.redirect(new URL(next, origin));
    }

    console.error('Auth verification error:', error);
    return NextResponse.redirect(new URL('/login?error=verification_failed', origin));
  }

  // Handle legacy format (if Supabase is using old email template)
  if (legacyToken) {
    const supabase = await createClient();

    // Try to exchange the legacy token
    const { error } = await supabase.auth.verifyOtp({
      type: 'magiclink',
      token_hash: legacyToken,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }

    console.error('Legacy token verification error:', error);
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(new URL('/login?error=auth_failed&message=Invalid or expired link', origin));
}
```

### Option 3: Use PKCE Flow Instead (Most Secure)

Update the login to use PKCE flow instead of magic links:

**File:** `/home/stian/Repos/barteløpet/app/login/page.tsx`

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);
  setError('');

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      // Add PKCE for better security
      shouldCreateUser: false, // Set to true if you want auto-registration
    },
  });

  if (error) {
    setError(error.message);
  } else {
    setSent(true);
  }

  setLoading(false);
}
```

## Testing the Fix

### 1. Test Email Template

After updating the Supabase email template:

```bash
# Start your dev server
npm run dev
```

1. Go to: http://localhost:3000/login
2. Enter your email address
3. Click "Send innloggingslenke"
4. Check your email
5. Click the link in the email
6. You should be redirected to `/dashboard` and logged in

### 2. Check the Email Link Format

The email link should look like:
```
http://localhost:3000/auth/callback?token_hash=abc123xyz&type=magiclink
```

**NOT** like:
```
http://localhost:3000/auth/confirm?token=abc123
```

### 3. Verify in Database

After successful login, check the database:

```sql
-- Check active sessions
SELECT * FROM auth.sessions ORDER BY created_at DESC LIMIT 5;

-- Check users
SELECT id, email, last_sign_in_at FROM auth.users ORDER BY last_sign_in_at DESC LIMIT 5;
```

## Common Issues and Solutions

### Issue 1: "Auth Code Already Used"

**Cause:** Clicking the magic link multiple times
**Solution:** Request a new magic link from the login page

### Issue 2: "Link Expired"

**Cause:** Magic links expire after 1 hour
**Solution:** Request a new magic link

### Issue 3: "Invalid Redirect URL"

**Cause:** Redirect URL not whitelisted in Supabase
**Solution:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your callback URL to **Redirect URLs**
3. Save changes

### Issue 4: Still Redirecting to Login

**Cause:** Email template not updated
**Solution:**
1. Double-check the email template in Supabase Dashboard
2. Make sure you're using the correct template variables
3. Test with a new email (old emails still have old links)

### Issue 5: CORS Errors

**Cause:** Site URL not configured
**Solution:**
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Set **Site URL** to your development URL (http://localhost:3000)
3. For production, set to your production domain

## Environment Variables Check

Make sure these are set in your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Debug Mode

Add this to your callback route to debug:

```typescript
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Debug logging
  console.log('=== AUTH CALLBACK DEBUG ===');
  console.log('Full URL:', request.url);
  console.log('token_hash:', searchParams.get('token_hash'));
  console.log('type:', searchParams.get('type'));
  console.log('Origin:', origin);

  // ... rest of the code
}
```

Check your terminal where `npm run dev` is running to see the logs.

## Production Deployment

When deploying to production:

1. **Update Supabase URL Configuration**
   - Set **Site URL** to: `https://your-production-domain.com`
   - Add redirect URLs:
     - `https://your-production-domain.com/auth/callback`
     - `https://your-production-domain.com/dashboard`

2. **Update Email Template**
   - Replace `{{ .SiteURL }}` references with production URL if needed

3. **Update Environment Variables**
   ```bash
   NEXT_PUBLIC_APP_URL=https://your-production-domain.com
   ```

## Alternative: Disable Email Confirmation

If you want to disable email confirmation entirely (not recommended for production):

1. Go to Supabase Dashboard → Authentication → Settings
2. **Email Auth** section
3. Uncheck "Enable email confirmations"
4. Users will be auto-logged in after registration

**Warning:** This reduces security. Only use for testing.

## Need Help?

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Magic Link Guide](https://supabase.com/docs/guides/auth/auth-magic-link)

## Next Steps

Once email auth is working:
1. ✅ Test registration flow
2. ✅ Test login flow
3. ✅ Test password reset (if using passwords)
4. Move on to Vipps integration testing
