# Test Google Login - Quick Guide

## ✅ What's Been Set Up

1. ✅ Google OAuth credentials added to Supabase
2. ✅ Google login button added to `/login` page
3. ✅ Registration form auto-fills from Google profile
4. ✅ Auth callback handles OAuth users

## 🧪 Test It Now

### Step 1: Go to Login Page

```bash
# Make sure dev server is running
npm run dev

# Open login page
open http://localhost:3000/login
```

You should see:
- **"Fortsett med Google"** button (with Google colors) at the top
- Email login form below

### Step 2: Click "Fortsett med Google"

1. Click the Google button
2. You'll be redirected to Google login
3. Select your Google account
4. Grant permissions (if asked)
5. You'll be redirected back to your app

### Step 3: Complete Registration

**If you're a new user:**
- You'll be redirected to `/pamelding` (registration page)
- You'll see: **"✅ Logget inn med Google"** message
- Your name and email will be pre-filled from Google
- Fill in:
  - **Postadresse** (required)
  - **Telefonnummer** (optional)
- Click **"Meld meg på"**
- You'll get a bib number
- Redirect to dashboard ✅

**If you already have a participant record:**
- You'll be redirected directly to `/dashboard` ✅

### Step 4: Verify in Database

```sql
-- Check the user was created
SELECT id, email, provider, created_at
FROM auth.users
WHERE email = 'your-google-email@gmail.com';

-- provider should be 'google'

-- Check participant record
SELECT id, user_id, email, full_name, bib_number
FROM participants
WHERE email = 'your-google-email@gmail.com';

-- Should be linked to auth.users.id
```

## 📊 Expected Flow

```
Click "Fortsett med Google"
         ↓
Google login popup
         ↓
Grant permissions
         ↓
Redirect to /auth/callback
         ↓
Check: Has participant record?
    ├─ NO → /pamelding (complete profile)
    └─ YES → /dashboard
         ↓
Fill postal address & phone
         ↓
Submit form
         ↓
Create participant record
         ↓
Dashboard ✅
```

## 🎯 What to Check

### In the UI:

- [ ] Google button visible on `/login`
- [ ] Clicking button opens Google login
- [ ] After login, redirected to `/pamelding`
- [ ] Registration form shows: "✅ Logget inn med Google"
- [ ] Email field is pre-filled and disabled
- [ ] Name field is pre-filled from Google
- [ ] Can fill postal address and submit
- [ ] Get bib number after submit
- [ ] Redirected to dashboard

### In the Database:

- [ ] User exists in `auth.users` with `provider='google'`
- [ ] User has `confirmed_at` timestamp (auto-confirmed)
- [ ] Participant exists in `participants`
- [ ] Participant `user_id` matches `auth.users.id`
- [ ] Participant has bib number

### In the Terminal:

Check your terminal where `npm run dev` is running. You should see:

```
=== AUTH CALLBACK ===
URL: http://localhost:3000/auth/callback?code=xxx
✅ Auth successful
🔗 Linking participant to auth user
✅ Redirecting to: /dashboard
```

Or if no participant yet:

```
ℹ️ No participant record, redirecting to registration
```

## 🔄 Test Returning User

1. **Logout** (or use private browsing)
2. Go to `/login`
3. Click **"Fortsett med Google"**
4. Select same Google account
5. Should redirect directly to `/dashboard` ✅ (no registration needed)

## 🐛 Troubleshooting

### Issue: "redirect_uri_mismatch"

**Cause:** Redirect URI not configured in Google Console

**Fix:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add to **Authorized redirect URIs**:
   ```
   https://ajmjykiiplqrulcmayjx.supabase.co/auth/v1/callback
   ```
4. Save and try again

### Issue: Button doesn't work / no redirect

**Check:**
1. Open browser console (F12)
2. Look for errors
3. Make sure Supabase credentials are in `.env.local`

### Issue: Redirected to /pamelding but form not pre-filled

**Cause:** User metadata not being read correctly

**Fix:**
Check in Supabase Dashboard → Authentication → Users:
- Click on your Google user
- Check `user_metadata` has `name` or `full_name`
- If empty, Google may not be sharing name - check scopes

### Issue: Email already exists error

**Cause:** You already registered with that email via email signup

**Options:**
1. Use different Google account
2. Or delete existing user:
   ```sql
   DELETE FROM participants WHERE email = 'your-email@gmail.com';
   DELETE FROM auth.users WHERE email = 'your-email@gmail.com';
   ```

## ✨ What Works Now

- ✅ One-click Google login
- ✅ No password needed
- ✅ Email automatically verified
- ✅ Name and email pre-filled from Google
- ✅ Seamless registration completion
- ✅ Returns directly to dashboard for existing users
- ✅ Works alongside email login

## 🎉 Success Criteria

You'll know it works when:
1. Clicking Google button → Google login popup
2. After authorization → Back to your app
3. Form pre-filled with your Google info
4. Submit form → Get bib number
5. Redirected to dashboard
6. Can logout and login again with Google instantly

## 🚀 Next Steps

Once Google login works:
1. Test with multiple Google accounts
2. Test returning user flow
3. Optionally add Facebook login (same process)
4. Move on to Vipps integration

**Test it now!** Just go to `/login` and click the Google button! 🎯
