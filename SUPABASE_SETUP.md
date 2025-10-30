# Barteløpet - Complete Supabase Setup Guide

Step-by-step guide to configure Supabase for the Barteløpet project, including database, authentication, storage, and email templates.

---

## Table of Contents

1. [Create Supabase Project](#create-supabase-project)
2. [Database Setup](#database-setup)
3. [Row Level Security (RLS)](#row-level-security-rls)
4. [Storage Configuration](#storage-configuration)
5. [Authentication Setup](#authentication-setup)
6. [Email Templates](#email-templates)
7. [Environment Variables](#environment-variables)
8. [Verify Setup](#verify-setup)

---

## Create Supabase Project

### 1. Sign Up for Supabase

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with:
   - GitHub (recommended)
   - GitLab
   - Email

### 2. Create New Project

1. Click **"New Project"**
2. Select or create an **Organization**
3. Fill in project details:

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | `bartelopet` | Project name |
| **Database Password** | Generate strong password | **SAVE THIS!** You'll need it later |
| **Region** | `Europe (eu-central-1)` | Closest to Norway |
| **Pricing Plan** | Free tier | Sufficient for development |

4. Click **"Create new project"**
5. Wait 2-3 minutes for project initialization

### 3. Access Project Dashboard

Once created, you'll see:
- Project URL: `https://xxxxxxxxxxxxx.supabase.co`
- Dashboard with Database, Auth, Storage tabs
- API settings

---

## Database Setup

### 1. Navigate to SQL Editor

1. In Supabase Dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**

### 2. Run Initial Schema Migration

Copy and paste the following SQL to create the database schema:

```sql
-- ============================================================
-- Barteløpet Database Schema - Initial Migration
-- Version: 1.0.0
-- Date: 2025-10-28
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Participants Table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  bib_number INTEGER UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  display_name TEXT,
  postal_address TEXT NOT NULL,
  phone_number TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Completions Table
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  completion_date DATE NOT NULL,
  completion_time TEXT,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  comment TEXT,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: One completion per participant
  CONSTRAINT one_completion_per_participant UNIQUE (participant_id)
);

-- Votes Table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  completion_id UUID REFERENCES completions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraint: One vote per participant (total)
  CONSTRAINT one_vote_per_participant UNIQUE (voter_id),

  -- Constraint: Cannot vote for own completion
  CONSTRAINT no_self_voting CHECK (
    voter_id != (SELECT participant_id FROM completions WHERE id = completion_id)
  )
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_participants_user_id ON participants(user_id);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_bib_number ON participants(bib_number);
CREATE INDEX idx_completions_participant_id ON completions(participant_id);
CREATE INDEX idx_completions_created_at ON completions(created_at DESC);
CREATE INDEX idx_completions_vote_count ON completions(vote_count DESC);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);
CREATE INDEX idx_votes_completion_id ON votes(completion_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate next bib number
CREATE OR REPLACE FUNCTION generate_bib_number()
RETURNS TRIGGER AS $$
DECLARE
  next_bib INTEGER;
BEGIN
  SELECT COALESCE(MAX(bib_number), 1000) + 1 INTO next_bib FROM participants;
  NEW.bib_number = next_bib;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update vote count on completion
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE completions
    SET vote_count = vote_count + 1
    WHERE id = NEW.completion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE completions
    SET vote_count = GREATEST(0, vote_count - 1)
    WHERE id = OLD.completion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: Auto-update updated_at on participants
CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at on completions
CREATE TRIGGER update_completions_updated_at
  BEFORE UPDATE ON completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-generate bib number on participant insert
CREATE TRIGGER generate_participant_bib_number
  BEFORE INSERT ON participants
  FOR EACH ROW
  WHEN (NEW.bib_number IS NULL)
  EXECUTE FUNCTION generate_bib_number();

-- Trigger: Update vote count on vote insert/delete
CREATE TRIGGER update_completion_vote_count
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_count();

-- ============================================================
-- INITIAL DATA (Optional - for testing)
-- ============================================================

-- You can add seed data here for development
-- Example:
-- INSERT INTO participants (user_id, email, full_name, postal_address, bib_number)
-- VALUES (gen_random_uuid(), 'test@example.com', 'Test User', 'Test Address 123, 4000 Stavanger', 1001);

```

3. Click **"Run"** or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows/Linux)
4. Verify output shows: ✅ **Success. No rows returned**

### 3. Verify Tables Created

1. Go to **"Table Editor"** (left sidebar)
2. Confirm these tables exist:
   - ✅ `participants`
   - ✅ `completions`
   - ✅ `votes`

---

## Row Level Security (RLS)

### 1. Enable RLS on All Tables

Go back to **SQL Editor** and run:

```sql
-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
```

### 2. Create RLS Policies for Participants Table

```sql
-- ============================================================
-- PARTICIPANTS TABLE POLICIES
-- ============================================================

-- Policy: Anyone can view active participants
CREATE POLICY "Public can view active participants"
  ON participants
  FOR SELECT
  USING (is_active = true);

-- Policy: Anyone can insert (for registration)
CREATE POLICY "Anyone can register as participant"
  ON participants
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own full record (even if inactive)
CREATE POLICY "Users can view own participant record"
  ON participants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own record
CREATE POLICY "Users can update own participant record"
  ON participants
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users cannot delete (soft delete via is_active)
-- No DELETE policy = no one can delete
```

### 3. Create RLS Policies for Completions Table

```sql
-- ============================================================
-- COMPLETIONS TABLE POLICIES
-- ============================================================

-- Policy: Anyone can view all completions
CREATE POLICY "Public can view all completions"
  ON completions
  FOR SELECT
  USING (true);

-- Policy: Authenticated participants can insert their own completion
CREATE POLICY "Participants can insert own completion"
  ON completions
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM participants WHERE id = participant_id
    )
  );

-- Policy: Participants can update their own completion
CREATE POLICY "Participants can update own completion"
  ON completions
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM participants WHERE id = participant_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM participants WHERE id = participant_id
    )
  );

-- Policy: Participants can delete their own completion
CREATE POLICY "Participants can delete own completion"
  ON completions
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM participants WHERE id = participant_id
    )
  );
```

### 4. Create RLS Policies for Votes Table

```sql
-- ============================================================
-- VOTES TABLE POLICIES
-- ============================================================

-- Policy: Users can view their own votes
CREATE POLICY "Users can view own votes"
  ON votes
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM participants WHERE id = voter_id
    )
  );

-- Policy: Anyone can view vote counts (aggregated)
-- This allows displaying vote counts without revealing who voted
CREATE POLICY "Public can view vote counts"
  ON votes
  FOR SELECT
  USING (true);

-- Policy: Authenticated participants can vote
CREATE POLICY "Participants can insert vote"
  ON votes
  FOR INSERT
  WITH CHECK (
    -- User must be authenticated
    auth.uid() IS NOT NULL
    -- User must be a registered participant
    AND auth.uid() IN (
      SELECT user_id FROM participants WHERE id = voter_id
    )
    -- Cannot vote for own completion (enforced by CHECK constraint too)
    AND voter_id != (
      SELECT participant_id FROM completions WHERE id = completion_id
    )
  );

-- Policy: Users can delete their own vote (change vote)
-- Note: We might want to disable this for "vote is final"
CREATE POLICY "Participants can delete own vote"
  ON votes
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM participants WHERE id = voter_id
    )
  );
```

### 5. Verify RLS Policies

```sql
-- Check all policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Storage Configuration

### 1. Create Storage Buckets

1. Go to **"Storage"** (left sidebar)
2. Click **"Create a new bucket"**

#### Bucket 1: Completion Photos

| Setting | Value |
|---------|-------|
| **Name** | `completion-photos` |
| **Public bucket** | ✅ Yes (photos need to be publicly viewable) |
| **File size limit** | `5242880` (5MB in bytes) |
| **Allowed MIME types** | `image/jpeg,image/png,image/webp,image/heic` |

Click **"Create bucket"**

#### Bucket 2: Avatars (Optional)

| Setting | Value |
|---------|-------|
| **Name** | `avatars` |
| **Public bucket** | ✅ Yes |
| **File size limit** | `2097152` (2MB) |
| **Allowed MIME types** | `image/jpeg,image/png,image/webp` |

Click **"Create bucket"**

### 2. Configure Storage RLS Policies

Go to **SQL Editor** and run:

```sql
-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================

-- Completion Photos Bucket Policies

-- Policy: Anyone can view completion photos
CREATE POLICY "Public can view completion photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'completion-photos');

-- Policy: Authenticated users can upload completion photos
CREATE POLICY "Authenticated users can upload completion photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'completion-photos'
    AND auth.role() = 'authenticated'
  );

-- Policy: Users can update their own completion photos
CREATE POLICY "Users can update own completion photos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'completion-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'completion-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own completion photos
CREATE POLICY "Users can delete own completion photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'completion-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- Avatars Bucket Policies (if using avatars)
-- ============================================================

-- Policy: Anyone can view avatars
CREATE POLICY "Public can view avatars"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload avatars
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 3. Verify Storage Buckets

1. Go to **"Storage"** → **"completion-photos"**
2. Click **"Policies"** tab
3. Verify 4 policies are active:
   - ✅ Public can view
   - ✅ Authenticated can upload
   - ✅ Users can update own
   - ✅ Users can delete own

---

## Authentication Setup

### 1. Configure Email Authentication

1. Go to **"Authentication"** → **"Providers"** (left sidebar)
2. Find **"Email"** provider
3. Click to configure:

| Setting | Value |
|---------|-------|
| **Email provider enabled** | ✅ Enabled |
| **Confirm email** | ❌ Disabled (using magic links) |
| **Secure email change** | ✅ Enabled |
| **Magic Link** | ✅ Enabled |

4. Click **"Save"**

### 2. Configure Site URL

1. Go to **"Authentication"** → **"URL Configuration"**
2. Set these values:

| Setting | Value | Notes |
|---------|-------|-------|
| **Site URL** | `http://localhost:3000` | For development |
| **Redirect URLs** | `http://localhost:3000/auth-callback` | Auth callback |

**For production, add:**
- Site URL: `https://bartelopet.no` (your domain)
- Redirect URLs: `https://bartelopet.no/auth-callback`

3. Click **"Save"**

### 3. Configure Email Rate Limiting

1. Go to **"Authentication"** → **"Rate Limits"**
2. Recommended settings:

| Setting | Value |
|---------|-------|
| **Email sent per hour** | `3` per email address |
| **Signup requests per hour** | `10` per IP address |

---

## Email Templates

### 1. Access Email Templates

1. Go to **"Authentication"** → **"Email Templates"**
2. You'll see templates for:
   - Magic Link
   - Confirmation
   - Password Reset (not used)
   - Email Change

### 2. Customize Magic Link Email

Click **"Magic Link"** template and replace with:

**Subject:**
```
Logg inn på Barteløpet
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Logg inn på Barteløpet</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f3f0;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #8c7355 0%, #705d46 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 20px;
      font-size: 16px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: #8c7355;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #705d46;
    }
    .footer {
      background: #f5f3f0;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .footer a {
      color: #8c7355;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦶 Barteløpet</h1>
    </div>
    <div class="content">
      <p>Hei!</p>
      <p>Klikk på knappen nedenfor for å logge inn på Barteløpet:</p>
      <p style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">Logg inn</a>
      </p>
      <p>Denne lenken utløper om 1 time og kan kun brukes én gang.</p>
      <p>Hvis du ikke ba om denne e-posten, kan du trygt ignorere den.</p>
      <p>Hilsen<br><strong>Barteløpet-teamet</strong></p>
    </div>
    <div class="footer">
      <p>Dette er en automatisk e-post fra Barteløpet.</p>
      <p>Spørsmål? Kontakt oss på <a href="mailto:post@bartelopet.no">post@bartelopet.no</a></p>
    </div>
  </div>
</body>
</html>
```

Click **"Save"**

### 3. Customize Confirmation Email (Registration)

Click **"Confirmation"** template and replace with:

**Subject:**
```
Velkommen til Barteløpet! Ditt startnummer: {{ .BibNumber }}
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Velkommen til Barteløpet</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f3f0;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #8c7355 0%, #705d46 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0 0 10px;
      font-size: 32px;
      font-weight: 600;
    }
    .bib-number {
      display: inline-block;
      background: white;
      color: #8c7355;
      padding: 20px 40px;
      border-radius: 8px;
      font-size: 48px;
      font-weight: 700;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #8c7355;
      margin: 0 0 15px;
      font-size: 22px;
    }
    .content p {
      margin: 0 0 20px;
      font-size: 16px;
    }
    .content ul {
      margin: 0 0 20px;
      padding-left: 20px;
    }
    .content li {
      margin-bottom: 10px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: #8c7355;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .info-box {
      background: #f5f3f0;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .footer {
      background: #f5f3f0;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .footer a {
      color: #8c7355;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🦶 Velkommen til Barteløpet!</h1>
      <p>Ditt startnummer:</p>
      <div class="bib-number">{{ .BibNumber }}</div>
    </div>
    <div class="content">
      <p>Hei {{ .Name }}!</p>
      <p>Takk for at du meldte deg på Barteløpet! Vi gleder oss til å løpe sammen i november.</p>

      <h2>Hva skjer nå?</h2>
      <ul>
        <li><strong>Gjennomfør løpet:</strong> Løp 10 km barfot i november</li>
        <li><strong>Ta bilde:</strong> Dokumenter gjennomføringen med et bilde</li>
        <li><strong>Last opp:</strong> Logg inn og last opp bildet ditt</li>
        <li><strong>Stem:</strong> Stem på ditt favorittbilde i galleriet</li>
      </ul>

      <div class="info-box">
        <h2>💰 Donasjon</h2>
        <p>Vipps til: <strong>12345678</strong><br>
        eller bankoverføring til: <strong>1234 56 78901</strong></p>
        <p><em>Alle midler går uavkortet til mental helse-forskning via Movember.</em></p>
      </div>

      <div class="info-box">
        <h2>🏆 Pokal</h2>
        <p>Alle som fullfører får pokal levert til denne adressen:<br>
        <strong>{{ .Address }}</strong></p>
      </div>

      <p style="text-align: center;">
        <a href="{{ .SiteURL }}/dashboard" class="button">Gå til Dashboard</a>
      </p>

      <p>Lykke til med løpet!</p>
      <p>Hilsen<br><strong>Barteløpet-teamet</strong></p>
    </div>
    <div class="footer">
      <p>Følg oss på sosiale medier for oppdateringer!</p>
      <p>Spørsmål? Kontakt oss på <a href="mailto:post@bartelopet.no">post@bartelopet.no</a></p>
    </div>
  </div>
</body>
</html>
```

**Note:** You'll need to send this email manually from your application after registration, as Supabase's built-in confirmation email doesn't include custom fields like bib number.

---

## Environment Variables

### 1. Get Supabase Credentials

1. Go to **"Settings"** → **"API"** (left sidebar)
2. Copy these values:

| Variable | Location | Example |
|----------|----------|---------|
| **Project URL** | Project URL section | `https://xxxxx.supabase.co` |
| **anon public** | Project API keys → anon public | `eyJhbGc...` |
| **service_role** | Project API keys → service_role | `eyJhbGc...` (🔒 Secret!) |

### 2. Add to .env.local

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Security Notes

⚠️ **IMPORTANT:**
- **NEVER commit** `.env.local` to Git
- **NEVER expose** `SUPABASE_SERVICE_ROLE_KEY` to client-side
- Use `NEXT_PUBLIC_` prefix only for client-safe variables
- Store secrets in Vercel environment variables for production

---

## Verify Setup

### 1. Test Database Connection

```bash
# Create test script: test-db.js
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  // Test table exists
  const { data, error } = await supabase
    .from('participants')
    .select('count');

  if (error) {
    console.error('❌ Database connection failed:', error.message);
  } else {
    console.log('✅ Database connection successful!');
    console.log('✅ Tables exist and are accessible');
  }
}

test();
"
```

### 2. Test Authentication

1. Start your Next.js dev server: `pnpm dev`
2. Navigate to login page: `http://localhost:3000/login`
3. Enter your email
4. Check email for magic link
5. Click link → should authenticate and redirect

### 3. Test Storage

1. Navigate to upload page (when implemented)
2. Try uploading an image
3. Verify image appears in **Storage** → **completion-photos**
4. Verify public URL works

### 4. Test RLS Policies

```sql
-- Test as anonymous user (should work)
SELECT * FROM participants WHERE is_active = true;

-- Test as authenticated user (should work)
-- (Run after authenticating in your app)
SELECT * FROM completions;

-- Test insert without auth (should fail)
INSERT INTO completions (participant_id, completion_date, photo_url, thumbnail_url)
VALUES (gen_random_uuid(), NOW(), 'test.jpg', 'thumb.jpg');
-- Expected: permission denied
```

---

## Troubleshooting

### Issue: Migration Errors

**Error:** `relation "participants" already exists`

**Solution:**
```sql
-- Drop all tables and start fresh (⚠️ DESTROYS DATA)
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS completions CASCADE;
DROP TABLE IF EXISTS participants CASCADE;

-- Then re-run migration
```

---

### Issue: RLS Blocking Valid Requests

**Error:** `new row violates row-level security policy`

**Solution:**
1. Check user is authenticated
2. Verify `auth.uid()` matches expected `user_id`
3. Review policy conditions
4. Temporarily disable RLS for debugging:
   ```sql
   ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
   ```

---

### Issue: Storage Upload Fails

**Error:** `Failed to upload to storage`

**Solution:**
1. Verify bucket exists
2. Check RLS policies on `storage.objects`
3. Verify file size under limit
4. Check MIME type is allowed
5. Ensure user is authenticated

---

## Next Steps

✅ **Database configured**
✅ **Authentication setup**
✅ **Storage ready**
✅ **Email templates customized**

Now you can:
1. Return to [SETUP.md](./SETUP.md) to continue development setup
2. Start implementing features in your Next.js app
3. Test registration, authentication, and uploads

---

**Last Updated:** 2025-10-28
**Maintained By:** Development Team
**Status:** Ready for Use
