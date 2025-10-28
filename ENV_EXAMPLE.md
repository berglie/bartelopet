# Environment Variables Documentation

Complete reference for all environment variables used in the Barteløpet project. This document explains each variable, where to find the values, and security considerations.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Setup](#quick-setup)
3. [Supabase Variables](#supabase-variables)
4. [Application Variables](#application-variables)
5. [Optional Variables](#optional-variables)
6. [Environment-Specific Values](#environment-specific-values)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### File Location

Environment variables are stored in `.env.local` (for local development) and configured in Vercel dashboard (for production).

```
barteløpet/
├── .env.local          # Your local environment (DO NOT COMMIT)
├── .env.example        # Template (safe to commit)
└── .env.production     # Not used (use Vercel dashboard instead)
```

### Variable Naming Convention

| Prefix | Visibility | Usage |
|--------|-----------|--------|
| `NEXT_PUBLIC_` | Client & Server | Exposed to browser, safe for client-side |
| No prefix | Server only | Secret values, API routes only |

⚠️ **IMPORTANT:** Never use `NEXT_PUBLIC_` prefix for sensitive data!

---

## Quick Setup

### 1. Copy Example File

```bash
# Copy the example file
cp .env.example .env.local

# Or create manually
touch .env.local
```

### 2. Fill Required Variables

Open `.env.local` and add:

```bash
# ============================================================
# REQUIRED - Supabase Configuration
# ============================================================

NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================
# REQUIRED - Application Configuration
# ============================================================

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Get Supabase Credentials

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions on creating a Supabase project and obtaining credentials.

---

## Supabase Variables

### NEXT_PUBLIC_SUPABASE_URL

**Purpose:** Supabase project URL for database and API connections

**Format:** `https://[project-id].supabase.co`

**Example:** `https://abcdefghijklmnop.supabase.co`

**Where to Find:**
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Navigate to **Settings** → **API**
4. Copy **Project URL**

**Used In:**
- Supabase client initialization (client and server)
- API route connections
- Authentication flows

**Visibility:** ✅ Public (safe to expose to client)

**Required:** ✅ Yes

---

### NEXT_PUBLIC_SUPABASE_ANON_KEY

**Purpose:** Public anonymous key for client-side Supabase connections

**Format:** JWT token (long string starting with `eyJ...`)

**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...`

**Where to Find:**
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Navigate to **Settings** → **API**
4. Copy **anon public** key (under Project API keys)

**Used In:**
- Client-side Supabase client
- Browser-based database queries
- Authentication flows
- File uploads from browser

**Security Notes:**
- Safe to expose to client (name includes "public")
- Protected by Row Level Security (RLS) policies
- Cannot bypass database security rules

**Visibility:** ✅ Public (safe to expose to client)

**Required:** ✅ Yes

---

### SUPABASE_SERVICE_ROLE_KEY

**Purpose:** Secret server-side key that bypasses RLS policies

**Format:** JWT token (long string starting with `eyJ...`)

**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...`

**Where to Find:**
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Navigate to **Settings** → **API**
4. Copy **service_role** key (🔒 Secret)

**Used In:**
- Server-side API routes only
- Administrative operations
- Bypassing RLS when necessary (use sparingly!)
- Sending emails

**Security Notes:**
- ⚠️ **NEVER expose to client-side code**
- ⚠️ **NEVER commit to Git**
- ⚠️ Bypasses all RLS policies
- Use only when absolutely necessary
- Keep separate from anon key

**Visibility:** 🔒 Secret (server-side only)

**Required:** ✅ Yes (for server operations)

---

## Application Variables

### NEXT_PUBLIC_APP_URL

**Purpose:** Base URL of your application for redirects and links

**Format:** `http://domain.com` or `https://domain.com` (no trailing slash)

**Examples:**
- Development: `http://localhost:3000`
- Production: `https://bartelopet.no`

**Used In:**
- Authentication redirects
- Email template links
- Canonical URLs
- Social sharing metadata

**Environment-Specific Values:**

| Environment | Value |
|-------------|-------|
| **Local Development** | `http://localhost:3000` |
| **Vercel Preview** | `https://bartelopet-git-[branch].vercel.app` |
| **Production** | `https://bartelopet.no` |

**Visibility:** ✅ Public (safe to expose)

**Required:** ✅ Yes

---

### NODE_ENV

**Purpose:** Indicates the current environment (development, production, test)

**Format:** One of: `development`, `production`, `test`

**Examples:**
- `development` - Local development
- `production` - Production deployment
- `test` - Running tests

**Used In:**
- Conditional logic (e.g., show debug info in dev only)
- Build optimizations
- Error handling
- Logging verbosity

**Set By:**
- Next.js automatically sets this
- You rarely need to set it manually

**Visibility:** ✅ Public

**Required:** ⚠️ Auto-set by Next.js

---

## Optional Variables

### Email Configuration (Optional)

If using custom SMTP instead of Supabase email:

```bash
# SMTP Configuration (Optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@bartelopet.no
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=Barteløpet <noreply@bartelopet.no>
```

**Purpose:** Send emails via custom SMTP server

**Required:** ❌ No (Supabase handles emails by default)

**Use When:**
- You want custom email provider (e.g., SendGrid, Mailgun)
- Supabase email limits are too restrictive
- Need advanced email features

**Visibility:** 🔒 Secret (SMTP credentials)

---

### Analytics and Monitoring (Optional)

```bash
# Vercel Analytics (Optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id

# Sentry Error Tracking (Optional)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=your_sentry_token
SENTRY_ORG=your_org
SENTRY_PROJECT=bartelopet

# Google Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Purpose:** Track analytics and errors

**Required:** ❌ No (recommended for production)

**Visibility:**
- Public IDs: ✅ Public
- Auth tokens: 🔒 Secret

---

### Feature Flags (Optional)

```bash
# Feature Flags (Optional)
NEXT_PUBLIC_ENABLE_VOTING=true
NEXT_PUBLIC_ENABLE_REGISTRATION=true
NEXT_PUBLIC_ENABLE_GALLERY=true
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

**Purpose:** Toggle features on/off without code changes

**Required:** ❌ No

**Visibility:** ✅ Public

---

## Environment-Specific Values

### Local Development (.env.local)

```bash
# Supabase (Development Project)
NEXT_PUBLIC_SUPABASE_URL=https://dev-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (dev anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (dev service key)

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Notes:**
- Use separate Supabase project for development
- Test data only
- Can be reset without consequence

---

### Vercel Preview (Branch Deployments)

```bash
# Supabase (Can use dev or staging project)
NEXT_PUBLIC_SUPABASE_URL=https://staging-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (staging anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (staging service key)

# Application
NEXT_PUBLIC_APP_URL=https://bartelopet-git-$VERCEL_GIT_COMMIT_REF.vercel.app
NODE_ENV=production
```

**Notes:**
- Preview deployments for each branch/PR
- Use staging Supabase project
- Safe for testing

---

### Production (Vercel)

```bash
# Supabase (Production Project)
NEXT_PUBLIC_SUPABASE_URL=https://prod-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (prod anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (prod service key)

# Application
NEXT_PUBLIC_APP_URL=https://bartelopet.no
NODE_ENV=production
```

**Notes:**
- Separate production Supabase project
- Real user data
- Extra caution with changes
- Never reset database

---

## Security Best Practices

### ✅ DO

1. **Use .env.local for local development**
   ```bash
   # Store in .env.local (ignored by Git)
   SUPABASE_SERVICE_ROLE_KEY=secret_key
   ```

2. **Add .env.local to .gitignore**
   ```gitignore
   # .gitignore
   .env.local
   .env*.local
   ```

3. **Use Vercel dashboard for production secrets**
   - Settings → Environment Variables
   - Mark as "Sensitive" to hide value

4. **Separate development and production projects**
   - Dev Supabase project for development
   - Prod Supabase project for production

5. **Use NEXT_PUBLIC_ prefix only for public data**
   ```bash
   # ✅ Safe - API endpoint
   NEXT_PUBLIC_API_URL=https://api.example.com

   # ❌ DANGER - Secret key
   NEXT_PUBLIC_SECRET_KEY=abc123  # NEVER DO THIS!
   ```

6. **Rotate keys regularly**
   - Generate new keys every 6-12 months
   - Immediately if compromised

---

### ❌ DON'T

1. **Never commit secrets to Git**
   ```bash
   # ❌ NEVER commit .env.local
   git add .env.local  # NO!

   # ✅ Only commit .env.example
   git add .env.example  # YES!
   ```

2. **Never use production keys in development**
   ```bash
   # ❌ Bad - mixing environments
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co  # NO!
   ```

3. **Never expose service_role key to client**
   ```typescript
   // ❌ DANGER - Exposes secret to browser
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY  // NO!
   );
   ```

4. **Never hardcode secrets in code**
   ```typescript
   // ❌ Bad - hardcoded secret
   const API_KEY = 'abc123def456';  // NO!

   // ✅ Good - from environment
   const API_KEY = process.env.API_KEY;  // YES!
   ```

5. **Never share secrets via insecure channels**
   - Don't send via email
   - Don't post in Slack/Discord
   - Use secure password managers

---

## Troubleshooting

### Issue: Environment Variables Not Loading

**Symptoms:**
- `undefined` when accessing env vars
- "NEXT_PUBLIC_SUPABASE_URL is not defined" error

**Solutions:**

1. **Restart development server** (required after changing .env.local)
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   pnpm dev
   ```

2. **Check file name is correct**
   ```bash
   # ✅ Correct
   .env.local

   # ❌ Wrong
   .env
   env.local
   .env.development
   ```

3. **Check variable syntax**
   ```bash
   # ✅ Correct
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co

   # ❌ Wrong - no spaces, no quotes
   NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
   ```

4. **Verify file is in project root**
   ```
   barteløpet/
   ├── .env.local          ✅ Here (project root)
   ├── src/
   │   └── .env.local      ❌ Not here
   ```

---

### Issue: Client-Side Variable Undefined

**Symptoms:**
- Variable works in API routes but not in components
- `process.env.VARIABLE_NAME` is `undefined` in browser

**Solutions:**

1. **Add NEXT_PUBLIC_ prefix for client-side**
   ```bash
   # ❌ Won't work in browser
   SUPABASE_URL=https://xxx.supabase.co

   # ✅ Works in browser
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   ```

2. **Use getServerSideProps for server-only vars**
   ```typescript
   // Access server-only vars in getServerSideProps
   export async function getServerSideProps() {
     const secretKey = process.env.SECRET_KEY;  // Works
     return { props: { /* ... */ } };
   }
   ```

---

### Issue: Wrong Environment in Production

**Symptoms:**
- Development URLs in production
- Connecting to dev database from prod

**Solutions:**

1. **Check Vercel environment variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify "Production" is selected for prod values

2. **Check Supabase project URLs match**
   ```bash
   # Development
   NEXT_PUBLIC_SUPABASE_URL=https://dev-xxx.supabase.co

   # Production
   NEXT_PUBLIC_SUPABASE_URL=https://prod-xxx.supabase.co
   ```

3. **Verify NEXT_PUBLIC_APP_URL**
   ```bash
   # Should match deployed domain
   NEXT_PUBLIC_APP_URL=https://bartelopet.no
   ```

---

### Issue: Supabase Connection Fails

**Symptoms:**
- "Invalid API key" error
- Connection timeout
- RLS policy violations

**Solutions:**

1. **Verify keys are correct**
   - Copy keys directly from Supabase dashboard
   - Check for extra spaces or line breaks

2. **Check Supabase project is active**
   - Not paused
   - Not exceeded free tier limits

3. **Test connection manually**
   ```bash
   # Create test file
   node -e "
   const { createClient } = require('@supabase/supabase-js');
   require('dotenv').config({ path: '.env.local' });
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
   );
   supabase.from('participants').select('count').then(console.log);
   "
   ```

---

## Complete .env.local Template

Copy this template to create your `.env.local` file:

```bash
# ============================================================
# Barteløpet - Environment Variables
# ============================================================
#
# Copy this file to .env.local and fill in your values
# NEVER commit .env.local to Git!
#
# See ENV_EXAMPLE.md for detailed documentation
# ============================================================

# ============================================================
# SUPABASE CONFIGURATION (Required)
# ============================================================
# Get these from: https://supabase.com → Project Settings → API

# Project URL (public - safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Anonymous Key (public - safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (SECRET - server-side only, never expose to client!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================
# APPLICATION CONFIGURATION (Required)
# ============================================================

# Your application URL
# Development: http://localhost:3000
# Production: https://bartelopet.no
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Node environment (auto-set by Next.js, but can override)
NODE_ENV=development

# ============================================================
# OPTIONAL - EMAIL CONFIGURATION
# ============================================================
# Only needed if using custom SMTP instead of Supabase email

# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=noreply@bartelopet.no
# SMTP_PASSWORD=your_smtp_password
# SMTP_FROM=Barteløpet <noreply@bartelopet.no>

# ============================================================
# OPTIONAL - ANALYTICS & MONITORING
# ============================================================

# Vercel Analytics (auto-enabled on Vercel)
# NEXT_PUBLIC_VERCEL_ANALYTICS_ID=

# Sentry Error Tracking
# SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
# SENTRY_AUTH_TOKEN=
# SENTRY_ORG=
# SENTRY_PROJECT=bartelopet

# Google Analytics
# NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# ============================================================
# OPTIONAL - FEATURE FLAGS
# ============================================================

# Enable/disable features without code changes
# NEXT_PUBLIC_ENABLE_VOTING=true
# NEXT_PUBLIC_ENABLE_REGISTRATION=true
# NEXT_PUBLIC_ENABLE_GALLERY=true
# NEXT_PUBLIC_MAINTENANCE_MODE=false

# ============================================================
# END OF CONFIGURATION
# ============================================================
```

---

## Additional Resources

### Documentation
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/local-development#accessing-your-project-s-environment-variables)

### Related Docs
- [SETUP.md](./SETUP.md) - Development setup
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase configuration
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment

---

**Last Updated:** 2025-10-28
**Maintained By:** Development Team
**Status:** Complete
