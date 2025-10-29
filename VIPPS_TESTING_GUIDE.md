# Vipps Login Testing Guide

## Prerequisites

- [ ] Vipps test credentials obtained from [portal.vipps.no](https://portal.vipps.no)
- [ ] Environment variables added to `.env.local`
- [ ] Database migration applied
- [ ] Dev server running (`npm run dev`)

## Test Environment Setup

### 1. Vipps Portal Configuration

**Register Redirect URI in Vipps Portal:**
1. Go to [portal.vipps.no](https://portal.vipps.no)
2. Select your test application
3. Navigate to "API Keys" or "Settings"
4. Add redirect URI: `http://localhost:3000/auth/vipps-callback`
5. Save changes

⚠️ **CRITICAL:** The redirect URI must match **exactly** (case-sensitive, no trailing slash)

### 2. Environment Variables

Add to `/home/stian/Repos/barteløpet/.env.local`:

```bash
# Vipps Test Configuration
VIPPS_CLIENT_ID=your_test_client_id
VIPPS_CLIENT_SECRET=your_test_client_secret
VIPPS_SUBSCRIPTION_KEY=your_subscription_key
VIPPS_MSN=your_merchant_serial_number
VIPPS_REDIRECT_URI=http://localhost:3000/auth/vipps-callback
VIPPS_ENVIRONMENT=test

# Vipps Test Environment URLs
VIPPS_AUTH_URL=https://apitest.vipps.no/access-management-1.0/access/oauth2/auth
VIPPS_TOKEN_URL=https://apitest.vipps.no/access-management-1.0/access/oauth2/token
VIPPS_USERINFO_URL=https://apitest.vipps.no/vipps-userinfo-api/userinfo

# Enable Vipps login
NEXT_PUBLIC_ENABLE_VIPPS_LOGIN=true
```

### 3. Database Migration

```bash
# Apply the migration
cd /home/stian/Repos/barteløpet
supabase migration up

# Or manually via Supabase Dashboard:
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. SQL Editor → New Query
# 4. Paste contents of supabase/migrations/20250101000003_vipps_oauth.sql
# 5. Run
```

## Testing Scenarios

### Scenario 1: New User Registration

**Steps:**
1. Visit `http://localhost:3000/test-vipps` (or your login page)
2. Click "Logg inn med Vipps"
3. Should redirect to Vipps test environment
4. Login with Vipps test account
5. Grant permissions
6. Should redirect back to your app
7. Should create new user and redirect to dashboard

**Verify:**
```sql
-- Check Supabase database
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 1;
SELECT * FROM participants ORDER BY created_at DESC LIMIT 1;

-- Should see:
-- - New user in auth.users
-- - user_metadata contains Vipps info
-- - New participant with vipps_sub
-- - auth_provider = 'vipps'
```

**Expected Database State:**
```
participants table:
  id: [uuid]
  user_id: [uuid from auth.users]
  email: test@example.com
  full_name: Test User
  vipps_sub: c06c4afe-d9e1-4c5d-939a-177d752a0944
  vipps_phone_number: +4798765432
  auth_provider: 'vipps'
  bib_number: [auto-generated]
  created_at: [timestamp]
```

### Scenario 2: Existing Vipps User Login

**Steps:**
1. Logout current user
2. Click "Logg inn med Vipps" again
3. Login with same Vipps test account
4. Should login immediately (no new user created)

**Verify:**
```sql
-- Check no duplicate users
SELECT COUNT(*) FROM participants WHERE vipps_sub = 'your-vipps-sub';
-- Should be 1

-- Check session created
SELECT * FROM auth.sessions WHERE user_id = 'your-user-id';
```

### Scenario 3: Account Linking (Email → Vipps)

**Steps:**
1. Create user via email first (use existing registration)
2. Login with email
3. Go to profile/settings (wherever you add LinkVippsButton)
4. Click "Koble til Vipps"
5. Authorize with Vipps
6. Should link accounts

**Verify:**
```sql
SELECT * FROM participants WHERE email = 'your-email@example.com';

-- Should see:
-- - vipps_sub populated
-- - vipps_phone_number populated
-- - auth_provider = 'both'
```

### Scenario 4: Error Handling

**Test 4a: User Denies Permission**
1. Start Vipps login
2. Click "Avbryt" or deny permissions in Vipps
3. Should redirect to login page with error message
4. Error should be in Norwegian

**Test 4b: Expired Session**
1. Start Vipps login (creates session in database)
2. Wait 11 minutes (session expires after 10 min)
3. Complete Vipps authorization
4. Should show error: "Sesjonen har utløpt"

**Test 4c: Invalid State**
1. Manually visit callback with random state:
   `http://localhost:3000/api/vipps/callback?code=test&state=invalid`
2. Should show error

**Test 4d: Missing Vipps Credentials**
1. Remove one env var (e.g., VIPPS_CLIENT_SECRET)
2. Try to login
3. Should show configuration error

### Scenario 5: Account Unlinking

**Steps:**
1. Have a user with auth_provider='both'
2. Send DELETE to `/api/vipps/link-account`
3. Should remove vipps_sub and set auth_provider='email'

**Verify:**
```sql
SELECT vipps_sub, auth_provider FROM participants WHERE id = 'your-participant-id';

-- Should see:
-- vipps_sub: NULL
-- auth_provider: 'email'
```

## Manual Testing Checklist

### OAuth Flow
- [ ] Clicking "Logg inn med Vipps" redirects to Vipps
- [ ] URL contains state parameter
- [ ] URL contains code_challenge parameter
- [ ] URL contains correct redirect_uri
- [ ] Vipps login page loads correctly

### Callback Handling
- [ ] Successful auth redirects to dashboard
- [ ] User is logged in (check session)
- [ ] User data is stored in database
- [ ] Error scenarios show Norwegian messages
- [ ] Loading page shows during redirect

### Database
- [ ] New users created correctly
- [ ] vipps_sub is unique
- [ ] auth_provider is set correctly
- [ ] No duplicate participants
- [ ] Sessions are stored in vipps_sessions
- [ ] Sessions expire after 10 minutes
- [ ] Sessions are deleted after use

### Security
- [ ] State parameter is validated
- [ ] Code verifier is not exposed to client
- [ ] Client secret is not exposed to client
- [ ] Sessions are single-use
- [ ] Expired sessions are rejected

### UI
- [ ] Vipps button renders correctly
- [ ] Loading states work
- [ ] Error messages display in Norwegian
- [ ] Success redirect works
- [ ] Account linking UI works

## Debugging

### Check Logs

```bash
# In terminal where dev server is running
# Look for console.log output from API routes
```

### Database Inspection

```sql
-- Check OAuth sessions
SELECT * FROM vipps_sessions ORDER BY created_at DESC;

-- Check participants
SELECT id, email, full_name, vipps_sub, auth_provider, created_at
FROM participants
ORDER BY created_at DESC
LIMIT 10;

-- Check auth users
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Check for orphaned sessions (should be cleaned up)
SELECT * FROM vipps_sessions WHERE expires_at < NOW();
```

### Common Issues

**Issue: "Invalid redirect_uri"**
- **Cause:** Redirect URI in code doesn't match Vipps portal
- **Fix:** Check exact match (http vs https, trailing slash, etc.)
- **Check:** `.env.local` VIPPS_REDIRECT_URI matches portal

**Issue: "Invalid state parameter"**
- **Cause:** Session expired or already used
- **Fix:** Start login flow again from beginning
- **Check:** Database for expired sessions

**Issue: "Configuration error"**
- **Cause:** Missing environment variables
- **Fix:** Check all VIPPS_* vars in `.env.local`
- **Restart:** Dev server after adding env vars

**Issue: "Network error"**
- **Cause:** Can't reach Vipps API
- **Fix:** Check internet connection
- **Check:** Are you using test URLs (apitest.vipps.no)?

**Issue: "Database error"**
- **Cause:** Migration not applied
- **Fix:** Run migration: `supabase migration up`
- **Check:** Tables exist: `vipps_sessions`, `participants.vipps_sub`

### Enable Debug Mode

Add to your API routes temporarily:

```typescript
// app/api/vipps/authorize/route.ts
console.log('=== VIPPS AUTHORIZE DEBUG ===')
console.log('Environment:', process.env.VIPPS_ENVIRONMENT)
console.log('Client ID:', process.env.VIPPS_CLIENT_ID?.substring(0, 10) + '...')
console.log('Redirect URI:', process.env.VIPPS_REDIRECT_URI)

// app/api/vipps/callback/route.ts
console.log('=== VIPPS CALLBACK DEBUG ===')
console.log('Code received:', !!code)
console.log('State received:', state)
console.log('Session found:', !!session)
```

## Test Data

### Vipps Test Users

Vipps provides test users. Common test phone numbers:
- Check [Vipps Test Guide](https://developer.vippsmobilepay.com/docs/test-environment/)
- Use Vipps test app or web interface

### Expected API Responses

**Token Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "scope": "openid email name phoneNumber"
}
```

**UserInfo Response:**
```json
{
  "sub": "c06c4afe-d9e1-4c5d-939a-177d752a0944",
  "email": "test@example.com",
  "email_verified": true,
  "name": "Test User",
  "given_name": "Test",
  "family_name": "User",
  "phoneNumber": "+4798765432",
  "phone_number_verified": true
}
```

## Production Testing

⚠️ **Before going to production:**

1. **Get Production Credentials**
   - Separate credentials for production
   - Update environment variables

2. **Update URLs**
   ```bash
   VIPPS_ENVIRONMENT=production
   VIPPS_REDIRECT_URI=https://bartelopet.no/auth/vipps-callback
   VIPPS_AUTH_URL=https://api.vipps.no/access-management-1.0/access/oauth2/auth
   VIPPS_TOKEN_URL=https://api.vipps.no/access-management-1.0/access/oauth2/token
   VIPPS_USERINFO_URL=https://api.vipps.no/vipps-userinfo-api/userinfo
   ```

3. **Register Production Redirect URI**
   - In Vipps portal, add production URI
   - Must match exactly (HTTPS required)

4. **Test in Staging**
   - Deploy to staging environment first
   - Test with production credentials but staging URL
   - Verify all flows work

5. **Monitor Production**
   - Set up error logging (Sentry recommended)
   - Monitor OAuth success rate
   - Track session creation

## Next Steps After Testing

Once all tests pass:

1. **Integrate into Login Page**
   - Add VippsLoginButton to `app/login/page.tsx`
   - Add VippsButtonScript to layout

2. **Add Account Management**
   - Add LinkVippsButton to profile/settings
   - Add AuthProviderDisplay to dashboard

3. **Set Up Monitoring**
   - Add error tracking
   - Set up alerts for failed OAuth flows

4. **Documentation**
   - Update user documentation
   - Create help articles in Norwegian

5. **Cleanup**
   - Remove test page (`app/test-vipps/page.tsx`)
   - Remove debug console.logs
   - Review and optimize

## Support

**Vipps Documentation:**
- [Login API Docs](https://developer.vippsmobilepay.com/docs/APIs/login-api/)
- [Test Environment](https://developer.vippsmobilepay.com/docs/test-environment/)
- [Troubleshooting](https://developer.vippsmobilepay.com/docs/APIs/login-api/troubleshooting/)

**Your Implementation Docs:**
- `VIPPS_OAUTH_IMPLEMENTATION.md` - Complete technical guide
- `lib/vipps/README.md` - Utilities documentation
- `components/auth/README.md` - Component usage

**Need Help?**
- Check Vipps Status: [status.vipps.no](https://status.vipps.no)
- Vipps Support: [Slack or developer support](https://vippsas.slack.com)
