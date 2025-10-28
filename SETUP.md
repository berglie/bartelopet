# Barteløpet - Development Setup Guide

Complete guide to setting up the Barteløpet development environment on your local machine.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Clone Repository](#clone-repository)
3. [Install Dependencies](#install-dependencies)
4. [Environment Variables](#environment-variables)
5. [Supabase Setup](#supabase-setup)
6. [Run Development Server](#run-development-server)
7. [Verify Setup](#verify-setup)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed on your system:

### Required Software

| Software | Minimum Version | Recommended Version | Download Link |
|----------|----------------|---------------------|---------------|
| **Node.js** | 18.17.0 | 20.x LTS | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 8.0.0 | Latest | [pnpm.io](https://pnpm.io/) |
| **Git** | 2.30.0 | Latest | [git-scm.com](https://git-scm.com/) |

### Check Installed Versions

```bash
# Check Node.js version
node --version
# Should output: v18.17.0 or higher

# Check pnpm version (install if not present)
pnpm --version
# Should output: 8.0.0 or higher

# Install pnpm if not installed
npm install -g pnpm

# Check Git version
git --version
# Should output: git version 2.30.0 or higher
```

### Optional Tools

- **VS Code** - Recommended code editor with Next.js extensions
- **Supabase CLI** - For local database management (optional but helpful)

---

## Clone Repository

### 1. Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/your-username/bartelopet.git

# Navigate to project directory
cd bartelopet
```

### 2. Verify Repository Structure

```bash
# List project structure
ls -la

# Should see:
# - src/
# - public/
# - supabase/
# - package.json
# - README.md
# - etc.
```

---

## Install Dependencies

### 1. Install Node Modules

```bash
# Install all dependencies using pnpm
pnpm install

# This will:
# - Read package.json
# - Download all dependencies
# - Create pnpm-lock.yaml (if not exists)
# - Create node_modules/ directory
```

**Expected output:**
```
Packages: +XXX
++++++++++++++++++++++++++++++
Progress: resolved XXX, reused XXX, downloaded 0, added XXX
Done in XXXs
```

### 2. Verify Installation

```bash
# Check if node_modules exists
ls node_modules

# Check installed packages
pnpm list
```

---

## Environment Variables

### 1. Create Environment File

```bash
# Copy example environment file
cp .env.example .env.local

# Or create manually
touch .env.local
```

### 2. Configure Environment Variables

Open `.env.local` in your editor and add the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional: Email Configuration (if using custom SMTP)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=user@example.com
# SMTP_PASSWORD=your_password
```

### 3. Get Supabase Credentials

**Important:** You need to create a Supabase project first. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

Quick steps:
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Navigate to Project Settings → API
4. Copy the Project URL and anon key
5. Copy the service_role key (keep this secret!)

### 4. Environment Variables Reference

For detailed explanation of each variable, see [ENV_EXAMPLE.md](./ENV_EXAMPLE.md)

---

## Supabase Setup

### 1. Create Supabase Project

Follow the complete guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

Quick checklist:
- ✅ Create Supabase account
- ✅ Create new project
- ✅ Run database migrations
- ✅ Configure storage buckets
- ✅ Set up authentication
- ✅ Configure email templates

### 2. Run Database Migrations

```bash
# Option A: Using Supabase CLI (recommended)
npx supabase db push

# Option B: Manually in Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of supabase/migrations/*.sql
# 3. Execute each migration in order
```

### 3. Verify Database Setup

```bash
# Check if tables are created
npx supabase db diff

# Should show no differences if migrations ran successfully
```

---

## Run Development Server

### 1. Start Next.js Development Server

```bash
# Start the development server
pnpm dev

# Alternative commands:
# npm run dev
# yarn dev
```

**Expected output:**
```
> bartelopet@0.1.0 dev
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in XXXms
```

### 2. Access Application

Open your browser and navigate to:

```
http://localhost:3000
```

You should see the Barteløpet homepage.

### 3. Development Server Features

- **Hot Reload** - Changes are reflected immediately
- **Fast Refresh** - React components update without full reload
- **Error Overlay** - Displays errors in browser
- **TypeScript Checking** - Real-time type checking

### 4. Available Scripts

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server (after build)
pnpm start

# Run linter
pnpm lint

# Run type checking
pnpm type-check

# Run tests (if configured)
pnpm test
```

---

## Verify Setup

### 1. Homepage Check

✅ **Test:** Navigate to `http://localhost:3000`
- Should display homepage
- No console errors
- Images load correctly

### 2. Registration Flow Check

✅ **Test:** Navigate to `/registrering` or registration page
- Form displays correctly
- Can enter data
- Form validation works

### 3. Authentication Check

✅ **Test:** Try to access `/dashboard`
- Should redirect to login if not authenticated
- Login form should work
- Magic link email should be sent (check Supabase logs)

### 4. API Routes Check

✅ **Test:** Check API routes are working

```bash
# Test health endpoint (if exists)
curl http://localhost:3000/api/health

# Or open in browser:
# http://localhost:3000/api/stats
```

### 5. Database Connection Check

✅ **Test:** Verify database connectivity
- Registration should save to database
- Check Supabase Dashboard → Table Editor
- Confirm data appears in `participants` table

---

## Troubleshooting

### Issue: Port 3000 Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
pnpm dev -p 3001
```

---

### Issue: Module Not Found

**Error:**
```
Module not found: Can't resolve '@/components/...'
```

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Next.js cache
rm -rf .next
pnpm dev
```

---

### Issue: Environment Variables Not Loading

**Error:**
```
NEXT_PUBLIC_SUPABASE_URL is undefined
```

**Solution:**
```bash
# 1. Verify .env.local exists
ls -la .env.local

# 2. Check file contents
cat .env.local

# 3. Ensure variables start with NEXT_PUBLIC_ for client-side
# 4. Restart development server (required after .env changes)
pnpm dev
```

---

### Issue: Supabase Connection Failed

**Error:**
```
Failed to connect to Supabase
```

**Solution:**
```bash
# 1. Verify Supabase URL and keys in .env.local
# 2. Check Supabase project is active (not paused)
# 3. Test connection:

# Create test file: test-supabase.js
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

### Issue: TypeScript Errors

**Error:**
```
Type 'X' is not assignable to type 'Y'
```

**Solution:**
```bash
# 1. Check TypeScript version
npx tsc --version

# 2. Regenerate types (if using Supabase types)
npx supabase gen types typescript --local > src/lib/supabase/types.ts

# 3. Restart TypeScript server in VS Code
# Command Palette (Cmd+Shift+P) -> "TypeScript: Restart TS Server"
```

---

### Issue: Sharp Module Error

**Error:**
```
Module did not self-register
Something went wrong installing the "sharp" module
```

**Solution:**
```bash
# Reinstall sharp
pnpm remove sharp
pnpm add sharp

# Or rebuild
pnpm rebuild sharp
```

---

### Issue: Database Migration Errors

**Error:**
```
Migration failed: relation "participants" already exists
```

**Solution:**
```bash
# 1. Check migration status
npx supabase migration list

# 2. If needed, reset database (WARNING: destroys data)
npx supabase db reset

# 3. Re-run migrations
npx supabase db push
```

---

### Issue: Image Upload Not Working

**Error:**
```
Failed to upload image to storage
```

**Solution:**
1. Verify storage buckets exist in Supabase
2. Check RLS policies on storage buckets
3. Verify file size is under limit (5MB)
4. Check file type is allowed (JPG, PNG, WEBP)
5. Review browser console for CORS errors

---

### Issue: Hot Reload Not Working

**Error:**
Files change but page doesn't update

**Solution:**
```bash
# 1. Clear Next.js cache
rm -rf .next

# 2. Restart dev server
pnpm dev

# 3. If still not working, try:
# - Disable browser extensions
# - Check file watcher limits (Linux):
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### Issue: Memory Issues

**Error:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm dev

# Or add to package.json:
{
  "scripts": {
    "dev": "NODE_OPTIONS='--max-old-space-size=4096' next dev"
  }
}
```

---

## Next Steps

After successful setup:

1. ✅ **Read the Architecture** - Review [ARCHITECTURE.md](./ARCHITECTURE.md)
2. ✅ **Explore Codebase** - Familiarize yourself with folder structure
3. ✅ **Run Tests** - Execute test suite (if available)
4. ✅ **Create Test Data** - Add sample participants and completions
5. ✅ **Start Development** - Begin implementing features!

---

## Additional Resources

### Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase configuration
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [ENV_EXAMPLE.md](./ENV_EXAMPLE.md) - Environment variables reference

### External Links
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## Getting Help

If you encounter issues not covered here:

1. **Check Documentation** - Review all docs in this repository
2. **Search Issues** - Look for similar issues on GitHub
3. **Create Issue** - Open a new issue with details:
   - Error message
   - Steps to reproduce
   - Environment (OS, Node version, etc.)
   - Screenshots if applicable

---

**Last Updated:** 2025-10-28
**Maintained By:** Development Team
**Status:** Ready for Use
