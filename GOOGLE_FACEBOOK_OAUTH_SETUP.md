# Google & Facebook OAuth Setup Guide

## 🎯 Overview

Add Google and Facebook login buttons to your app in addition to email and Vipps login.

## 📋 Prerequisites

- Supabase project (you have this)
- Google account (for Google OAuth setup)
- Facebook account (for Facebook OAuth setup)

---

## 🔵 Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name: "Barteløpet"
   - Click "Create"

3. **Enable Google+ API**
   - Search for "Google+ API" in the search bar
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to: **APIs & Services** → **Credentials**
   - Click: **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**

5. **Configure OAuth Consent Screen** (if prompted)
   - User Type: **External**
   - App name: **Barteløpet**
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `email` and `profile`
   - Test users: Add your email (for testing)
   - Click **Save and Continue**

6. **Create OAuth Client**
   - Application type: **Web application**
   - Name: **Barteløpet Web**

   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://ajmjykiiplqrulcmayjx.supabase.co
   ```

   **Authorized redirect URIs:**
   ```
   https://ajmjykiiplqrulcmayjx.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

   - Click **Create**

7. **Copy Credentials**
   - Copy **Client ID**
   - Copy **Client secret**

### Step 2: Configure in Supabase

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your **barteløpet** project

2. **Enable Google Provider**
   - Go to: **Authentication** → **Providers**
   - Find **Google**
   - Toggle it **ON** ✅

3. **Enter Credentials**
   - Paste **Client ID**
   - Paste **Client Secret**
   - Click **Save**

### Step 3: Update Your Code

Add Google login button to your login page.

---

## 🔷 Facebook OAuth Setup

### Step 1: Create Facebook App

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/

2. **Create New App**
   - Click **"Create App"**
   - Use case: **Consumer** (or "Authenticate and request data from users")
   - Click **Next**

3. **App Details**
   - App name: **Barteløpet**
   - App contact email: Your email
   - Click **Create App**

4. **Add Facebook Login**
   - In dashboard, click **"Add Product"**
   - Find **"Facebook Login"**
   - Click **Set Up**

5. **Configure Facebook Login**
   - Select: **Web**
   - Site URL: `http://localhost:3000`
   - Click **Save** and **Continue**

6. **Settings → Basic**
   - Copy **App ID**
   - Copy **App Secret** (click "Show")

7. **Facebook Login Settings**
   - Go to: **Products** → **Facebook Login** → **Settings**

   **Valid OAuth Redirect URIs:**
   ```
   https://ajmjykiiplqrulcmayjx.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

   - Click **Save Changes**

8. **Make App Live** (for testing)
   - Top right: Toggle from **"In Development"** to **"Live"**
   - Or add test users in **Roles** → **Test Users**

### Step 2: Configure in Supabase

1. **Go to Supabase Dashboard**
   - Authentication → Providers

2. **Enable Facebook Provider**
   - Find **Facebook**
   - Toggle it **ON** ✅

3. **Enter Credentials**
   - Paste **App ID** (as Client ID)
   - Paste **App Secret** (as Client Secret)
   - Click **Save**

---

## 💻 Update Your Application Code

### 1. Update Login Page

**File:** `/home/stian/Repos/barteløpet/app/login/page.tsx`

Add after the email login form:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  // ... existing code ...

  // Add new function for OAuth login
  async function handleOAuthLogin(provider: 'google' | 'facebook') {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(`Kunne ikke logge inn med ${provider === 'google' ? 'Google' : 'Facebook'}`);
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Logg inn</CardTitle>
          <CardDescription>
            Velg hvordan du vil logge inn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OAuth Buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => handleOAuthLogin('google')}
              variant="outline"
              className="w-full"
              type="button"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Fortsett med Google
            </Button>

            <Button
              onClick={() => handleOAuthLogin('facebook')}
              variant="outline"
              className="w-full"
              type="button"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Fortsett med Facebook
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Eller med e-post
              </span>
            </div>
          </div>

          {/* Existing email form */}
          {/* ... your existing email login code ... */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. Update Auth Callback

Your existing callback at `/app/auth/callback/route.ts` should already handle OAuth callbacks automatically! No changes needed.

### 3. Handle OAuth User Registration

When a user logs in with Google/Facebook for the first time, you need to create their participant record.

**Update:** `/app/pamelding/page.tsx`

```typescript
export default async function RegistrationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is authenticated but no participant record
  if (user) {
    const { data: participant } = await supabase
      .from('participants')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (participant) {
      redirect('/dashboard');
    }

    // User logged in with OAuth but needs to complete profile
    // The registration form will auto-fill email from OAuth
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      {user && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            👋 Velkommen! Fyll ut profilen din for å fullføre registreringen.
          </p>
        </div>
      )}

      <RegistrationForm />
    </div>
  );
}
```

### 4. Pre-fill Registration Form

**Update:** `/components/registration-form.tsx`

Add this at the beginning of the component:

```typescript
export function RegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bibNumber, setBibNumber] = useState<number | null>(null);

  // NEW: Pre-fill from OAuth user data
  const [prefillData, setPrefillData] = useState<{
    email: string;
    full_name: string;
  } | null>(null);

  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setPrefillData({
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        });
      }
    }

    loadUserData();
  }, []);

  // Then in your form inputs, add defaultValue:
  <Input
    id="email"
    name="email"
    type="email"
    required
    defaultValue={prefillData?.email || ''}
    placeholder="ola@example.com"
    disabled={loading || !!prefillData?.email}
  />

  <Input
    id="full_name"
    name="full_name"
    required
    defaultValue={prefillData?.full_name || ''}
    placeholder="Ola Nordmann"
    disabled={loading}
  />
}
```

---

## 🧪 Testing

### Test Google Login

1. Clean database (optional):
   ```sql
   DELETE FROM participants WHERE email = 'your-gmail@gmail.com';
   DELETE FROM auth.users WHERE email = 'your-gmail@gmail.com';
   ```

2. Go to login page:
   ```
   http://localhost:3000/login
   ```

3. Click **"Fortsett med Google"**

4. Select Google account

5. Should redirect to `/pamelding` to complete profile

6. Fill in address and phone → Submit

7. → Dashboard ✅

### Test Facebook Login

Same flow as Google, but click **"Fortsett med Facebook"**

---

## 🔒 Security Notes

### Google

- ✅ Automatically verified email
- ✅ User profile data (name, photo)
- ✅ Single Sign-On (SSO)

### Facebook

- ✅ Automatically verified email
- ✅ User profile data (name, photo)
- ✅ Single Sign-On (SSO)
- ⚠️ May require app review for production

---

## 📊 Database Changes

OAuth users are stored the same as email users:

```sql
-- auth.users table
id: user-uuid
email: user@gmail.com
provider: google  ← Or 'facebook'
email_confirmed_at: 2025-10-29...  ← Always confirmed
user_metadata: {
  full_name: "John Doe",
  avatar_url: "https://...",
  provider_id: "123456789",
  iss: "https://accounts.google.com"
}

-- participants table (after profile completion)
id: participant-uuid
user_id: user-uuid  ← Links to auth.users
email: user@gmail.com
full_name: "John Doe"
postal_address: "User entered address"
phone_number: "12345678"
bib_number: 1001
```

---

## 🌍 Production Deployment

### Google

1. Update **Authorized JavaScript origins**:
   ```
   https://bartelopet.no
   ```

2. Update **Authorized redirect URIs**:
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   ```

3. **Publish OAuth Consent Screen** (if not already)

### Facebook

1. Update **Valid OAuth Redirect URIs**:
   ```
   https://YOUR_PROJECT.supabase.co/auth/v1/callback
   ```

2. **Submit App for Review** (Facebook requires this for production)
   - Required permissions: `email`, `public_profile`
   - Provide test instructions
   - Usually approved in 1-3 days

3. **Switch App to Live Mode**

---

## 🎨 Custom Styling

### Google Button Colors

```css
.google-button {
  background: white;
  color: #757575;
  border: 1px solid #dadce0;
}

.google-button:hover {
  background: #f8f9fa;
}
```

### Facebook Button Colors

```css
.facebook-button {
  background: #1877f2;
  color: white;
  border: none;
}

.facebook-button:hover {
  background: #166fe5;
}
```

---

## ❓ Troubleshooting

### Google: "redirect_uri_mismatch"

**Fix:** Make sure redirect URI in Google Console exactly matches:
```
https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

### Facebook: "Invalid OAuth Redirect URI"

**Fix:** Add the URI in Facebook App → Settings → Facebook Login Settings

### User Created but No Participant

**Expected!** OAuth users must complete their profile at `/pamelding` first.

### Email Already Exists

User already registered with email. They should use original login method or link accounts.

---

## 🎯 Summary

1. ✅ Create Google OAuth credentials
2. ✅ Create Facebook app
3. ✅ Enable both in Supabase
4. ✅ Add OAuth buttons to login page
5. ✅ Pre-fill registration form
6. ✅ Test both flows

**Both OAuth providers are much easier than email confirmation!** 🚀

Users can now:
- Login with Google
- Login with Facebook
- Login with Email (magic link)
- Login with Vipps (once you add credentials)

All methods work together seamlessly!
