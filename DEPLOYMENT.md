# Barteløpet - Vercel Deployment Guide

Complete guide to deploying the Barteløpet application to Vercel with production-ready configuration.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Prepare for Deployment](#prepare-for-deployment)
3. [Connect GitHub Repository](#connect-github-repository)
4. [Configure Vercel Project](#configure-vercel-project)
5. [Environment Variables](#environment-variables)
6. [Build Configuration](#build-configuration)
7. [Domain Setup](#domain-setup)
8. [Post-Deployment Steps](#post-deployment-steps)
9. [Monitoring and Logs](#monitoring-and-logs)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts

- ✅ **GitHub Account** - Repository hosting
- ✅ **Vercel Account** - Application hosting
- ✅ **Supabase Account** - Backend services
- ✅ **Domain** (optional) - Custom domain like `bartelopet.no`

### Required Setup

- ✅ **Repository on GitHub** - Code pushed to main branch
- ✅ **Supabase Project** - Production database configured
- ✅ **Local Testing Complete** - Application works locally
- ✅ **Environment Variables** - Production values ready

---

## Prepare for Deployment

### 1. Verify Local Build

Before deploying, ensure the application builds successfully locally:

```bash
# Build the application
pnpm build

# Expected output:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Finalizing page optimization
```

**If build fails:**
- Fix all TypeScript errors
- Fix all ESLint errors
- Resolve missing dependencies
- Check environment variables

### 2. Verify Production Environment Variables

Create a checklist of required environment variables:

```bash
# Required for production:
✅ NEXT_PUBLIC_SUPABASE_URL (production Supabase URL)
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY (production anon key)
✅ SUPABASE_SERVICE_ROLE_KEY (production service key)
✅ NEXT_PUBLIC_APP_URL (your production domain)
```

### 3. Update Supabase Redirect URLs

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add production URLs:

```
Site URL: https://bartelopet.no
Redirect URLs:
  - https://bartelopet.no/auth-callback
  - https://bartelopet.vercel.app/auth-callback (Vercel preview URL)
```

### 4. Commit All Changes

```bash
# Check status
git status

# Add all files
git add .

# Commit
git commit -m "Prepare for production deployment"

# Push to GitHub
git push origin main
```

---

## Connect GitHub Repository

### 1. Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### 2. Import Project

1. Click **"Add New..."** → **"Project"**
2. Find your repository in the list
3. Click **"Import"**

**If repository not visible:**
- Click **"Adjust GitHub App Permissions"**
- Grant access to the repository
- Return and refresh

### 3. Configure Project

Vercel will detect it's a Next.js project automatically:

| Setting | Value | Notes |
|---------|-------|-------|
| **Framework Preset** | Next.js | Auto-detected |
| **Root Directory** | `./` | Keep default |
| **Build Command** | `pnpm build` | Auto-detected |
| **Output Directory** | `.next` | Auto-detected |
| **Install Command** | `pnpm install` | Auto-detected |

---

## Configure Vercel Project

### 1. Project Settings

1. In Vercel dashboard, go to your project
2. Click **"Settings"** tab

| Setting | Value |
|---------|-------|
| **Project Name** | `bartelopet` |
| **Framework** | Next.js |
| **Node.js Version** | 20.x (recommended) |
| **Region** | Stockholm (closest to Norway) |

### 2. Build & Development Settings

Navigate to **Settings** → **General**

| Setting | Value | Notes |
|---------|-------|-------|
| **Build Command** | `pnpm build` | Default is fine |
| **Output Directory** | `.next` | Next.js default |
| **Install Command** | `pnpm install` | Uses pnpm |
| **Development Command** | `pnpm dev` | For preview |

### 3. Root Directory

Keep as **`./`** unless you have a monorepo structure.

---

## Environment Variables

### 1. Add Environment Variables

1. In Vercel project, go to **Settings** → **Environment Variables**
2. Add each variable:

#### Production Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxxxxxxxxxxx.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development

NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environments: ✅ Production ✅ Preview ✅ Development

SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environments: ✅ Production ✅ Preview ⬜ Development
⚠️ Sensitive - Mark as sensitive

# Application Configuration
NEXT_PUBLIC_APP_URL
Value: https://bartelopet.no
Environments: ✅ Production ⬜ Preview ⬜ Development

# For Preview deployments (optional)
NEXT_PUBLIC_APP_URL
Value: https://bartelopet-git-{{branch}}.vercel.app
Environments: ⬜ Production ✅ Preview ⬜ Development
```

### 2. Environment Variable Best Practices

**Security:**
- ✅ Mark secrets as "Sensitive" (hides value in UI)
- ✅ Never commit secrets to Git
- ✅ Use `NEXT_PUBLIC_` prefix only for client-safe variables
- ❌ Never expose `SERVICE_ROLE_KEY` to client

**Organization:**
- Group by category (Supabase, App, Email, etc.)
- Use consistent naming conventions
- Document each variable's purpose

### 3. Verify Variables

After adding all variables:
1. Go to **Deployments** tab
2. Trigger new deployment
3. Check build logs for "Loading env variables"

---

## Build Configuration

### 1. next.config.js

Ensure your `next.config.js` is production-ready:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Image optimization
  images: {
    domains: ['xxxxxxxxxxxxx.supabase.co'], // Your Supabase project URL
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
```

### 2. package.json Scripts

Verify your `package.json` has the correct scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

### 3. TypeScript Configuration

Ensure `tsconfig.json` is configured for production:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## Domain Setup

### 1. Add Custom Domain

1. In Vercel project, go to **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain: `bartelopet.no`
4. Click **"Add"**

### 2. Configure DNS

Vercel will provide DNS records to configure:

**Option A: Use Vercel Nameservers (Recommended)**
1. Copy Vercel nameservers
2. Go to your domain registrar (e.g., Namecheap, GoDaddy)
3. Update nameservers to Vercel's
4. Wait for DNS propagation (up to 48 hours)

**Option B: Use CNAME Record**
1. In your DNS provider, add CNAME record:
   ```
   Type: CNAME
   Name: @ (or www)
   Value: cname.vercel-dns.com
   TTL: 3600
   ```
2. Add A record for root domain:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: 3600
   ```

### 3. SSL Certificate

Vercel automatically provisions SSL certificates:
- ✅ Free SSL/TLS via Let's Encrypt
- ✅ Automatic renewal
- ✅ Enforced HTTPS

Verify SSL is active:
1. Wait for DNS propagation
2. Visit `https://bartelopet.no`
3. Check for 🔒 padlock in browser

### 4. Redirect Apex to WWW (Optional)

If you want `www.bartelopet.no` to be primary:
1. Add both `bartelopet.no` and `www.bartelopet.no`
2. In **Domains** settings, click on `bartelopet.no`
3. Choose **"Redirect to www.bartelopet.no"**

---

## Post-Deployment Steps

### 1. Verify Deployment

✅ **Check Homepage**
- Visit `https://bartelopet.no`
- Verify page loads correctly
- Check for console errors

✅ **Test Registration**
- Navigate to registration page
- Fill out form
- Verify email is sent
- Check data in Supabase

✅ **Test Authentication**
- Request magic link
- Click link in email
- Verify redirect to dashboard

✅ **Test File Upload**
- Upload completion photo
- Verify image appears
- Check Supabase Storage

✅ **Test Voting**
- Vote on a photo
- Verify vote count increases
- Check votes table

### 2. Update Supabase URLs

Ensure Supabase has correct production URLs:

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Update:
   ```
   Site URL: https://bartelopet.no
   Redirect URLs:
     - https://bartelopet.no/auth-callback
     - https://www.bartelopet.no/auth-callback
     - https://bartelopet.vercel.app/auth-callback
   ```

### 3. Configure Email Templates

Update email templates with production domain:

In Supabase → **Authentication** → **Email Templates**:
- Replace `http://localhost:3000` with `https://bartelopet.no`
- Update logo URLs (if hosted)
- Test email delivery

### 4. Set Up Monitoring

**Vercel Analytics** (optional but recommended):
1. Go to project **Settings** → **Analytics**
2. Enable Vercel Analytics
3. Add analytics code to your app (if not auto-injected)

**Sentry** (optional error tracking):
1. Create Sentry account
2. Install Sentry SDK:
   ```bash
   pnpm add @sentry/nextjs
   ```
3. Configure Sentry in your app
4. Add `SENTRY_DSN` to Vercel env variables

### 5. Performance Optimization

**Enable Edge Functions** (if needed):
```javascript
// In your API route or page
export const runtime = 'edge';
```

**Enable ISR** (Incremental Static Regeneration):
```typescript
// In page.tsx
export const revalidate = 60; // Revalidate every 60 seconds
```

**Image Optimization:**
- Verify Next.js Image component is used everywhere
- Check images are served as WebP/AVIF
- Confirm lazy loading is working

---

## Monitoring and Logs

### 1. View Deployment Logs

1. Go to **Deployments** tab
2. Click on latest deployment
3. View **Build Logs** and **Function Logs**

**What to check:**
- ✅ Build completed successfully
- ✅ No TypeScript errors
- ✅ Environment variables loaded
- ✅ All pages generated

### 2. Real-Time Function Logs

1. Go to **Deployments** → **Functions**
2. Select a function
3. View real-time logs

**Useful for debugging:**
- API route errors
- Authentication issues
- Database queries

### 3. Vercel Analytics

If enabled, view:
- Page views
- Load times
- Core Web Vitals
- User geography

Access: **Analytics** tab in project

### 4. Monitor Build Time

Keep build times under 10 minutes:
- Review build logs for slow steps
- Optimize dependencies
- Use caching strategies

### 5. Check Error Rates

1. Go to **Deployments** → Select deployment
2. Check **Errors** section
3. Investigate any 500 errors

---

## Troubleshooting

### Issue: Build Fails

**Error:** `Build failed with exit code 1`

**Solution:**
```bash
# Check build logs in Vercel
# Common causes:

1. TypeScript errors
   - Fix all type errors locally first
   - Run: pnpm build

2. Missing dependencies
   - Ensure all deps in package.json
   - Delete node_modules and reinstall

3. Environment variables missing
   - Verify all required vars in Vercel
   - Check variable names match exactly

4. Out of memory
   - Increase Node.js memory:
   # In package.json
   "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
```

---

### Issue: Environment Variables Not Working

**Error:** `NEXT_PUBLIC_SUPABASE_URL is undefined`

**Solution:**
1. Verify variables exist in Vercel → **Settings** → **Environment Variables**
2. Check variable names are EXACTLY correct (case-sensitive)
3. Ensure correct environments are selected (Production, Preview, Development)
4. Redeploy after adding variables (required!)

---

### Issue: Images Not Loading

**Error:** `Invalid src prop`

**Solution:**
1. Add Supabase domain to `next.config.js`:
   ```javascript
   images: {
     domains: ['xxxxxxxxxxxxx.supabase.co'],
   }
   ```
2. Redeploy

---

### Issue: Authentication Redirects Fail

**Error:** `Invalid redirect URL`

**Solution:**
1. Check Supabase → **Authentication** → **URL Configuration**
2. Ensure production URLs are listed:
   ```
   https://bartelopet.no/auth-callback
   https://www.bartelopet.no/auth-callback
   ```
3. Check Vercel env `NEXT_PUBLIC_APP_URL` is correct

---

### Issue: API Routes Return 500

**Error:** `Internal Server Error`

**Solution:**
1. Check **Function Logs** in Vercel
2. Common causes:
   - Database connection failed (check Supabase credentials)
   - Missing environment variables
   - Unhandled exceptions (add try-catch blocks)
3. Add logging to API routes:
   ```typescript
   console.log('API called:', request.url);
   console.log('Env vars:', process.env.NEXT_PUBLIC_SUPABASE_URL);
   ```

---

### Issue: Slow Performance

**Problem:** Pages load slowly

**Solution:**
1. Check Core Web Vitals in Vercel Analytics
2. Optimize images:
   - Use Next.js Image component
   - Compress images before upload
   - Use appropriate sizes
3. Enable ISR for static content:
   ```typescript
   export const revalidate = 3600;
   ```
4. Use React.lazy() for heavy components
5. Check database query performance

---

### Issue: Domain Not Working

**Error:** `DNS_PROBE_FINISHED_NXDOMAIN`

**Solution:**
1. Wait for DNS propagation (up to 48 hours)
2. Check DNS configuration:
   ```bash
   # Check DNS records
   nslookup bartelopet.no

   # Check if pointing to Vercel
   dig bartelopet.no
   ```
3. Verify DNS records in your domain registrar
4. Contact Vercel support if issues persist

---

### Issue: SSL Certificate Not Provisioned

**Error:** `NET::ERR_CERT_COMMON_NAME_INVALID`

**Solution:**
1. Wait up to 24 hours for certificate provisioning
2. Ensure DNS is correctly configured
3. Check domain ownership verification
4. In Vercel, go to **Domains** → Click domain → **Refresh Certificate**

---

## Deployment Checklist

Before considering deployment complete:

### Pre-Deployment
- ✅ Local build successful (`pnpm build`)
- ✅ All tests passing
- ✅ TypeScript errors resolved
- ✅ ESLint warnings addressed
- ✅ Environment variables documented
- ✅ Supabase production database configured
- ✅ Code pushed to GitHub

### Deployment
- ✅ Vercel project created
- ✅ GitHub repository connected
- ✅ Environment variables added
- ✅ Build configuration verified
- ✅ Custom domain added (if applicable)
- ✅ DNS configured
- ✅ SSL certificate active

### Post-Deployment
- ✅ Homepage loads correctly
- ✅ Registration works
- ✅ Authentication works
- ✅ File uploads work
- ✅ Voting works
- ✅ Emails are sent
- ✅ Database operations successful
- ✅ No console errors
- ✅ Mobile view tested
- ✅ Performance acceptable
- ✅ Monitoring configured

---

## Continuous Deployment

### Automatic Deployments

Vercel automatically deploys:
- **Production:** Every push to `main` branch
- **Preview:** Every push to other branches
- **Pull Requests:** Each PR gets a unique preview URL

### Preview Deployments

Each PR gets a preview URL:
```
https://bartelopet-git-feature-branch.vercel.app
```

**Features:**
- ✅ Isolated environment
- ✅ Separate database (use preview env vars)
- ✅ Share with team for review
- ✅ Automatic cleanup after merge

### Branch Protection

Recommended GitHub branch protection rules:
1. Require pull request reviews
2. Require status checks (Vercel build)
3. Require branches to be up to date
4. Prohibit force pushes

---

## Additional Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

### Tools
- [Vercel CLI](https://vercel.com/docs/cli) - Deploy from command line
- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer) - Analyze bundle size

### Support
- [Vercel Support](https://vercel.com/support)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

---

**Last Updated:** 2025-10-28
**Maintained By:** Development Team
**Status:** Production Ready
