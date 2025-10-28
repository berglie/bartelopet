# Barteløpet - Complete Requirements Analysis & Specifications

**Project**: Barteløpet - Virtual Charity Run for Movember
**Location**: Stavanger, Norway
**Purpose**: Mental health research fundraising via virtual 10km runs
**Date**: November (annual event)
**Analyst Agent**: ANALYST
**Analysis Date**: 2025-10-28

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Functional Requirements](#functional-requirements)
3. [Non-Functional Requirements](#non-functional-requirements)
4. [Data Requirements](#data-requirements)
5. [Integration Requirements](#integration-requirements)
6. [User Stories & Journeys](#user-stories--journeys)
7. [Edge Cases & Constraints](#edge-cases--constraints)
8. [API Specifications](#api-specifications)
9. [Validation Rules](#validation-rules)
10. [Error Handling Requirements](#error-handling-requirements)
11. [Test Scenarios](#test-scenarios)
12. [Security Requirements](#security-requirements)

---

## Executive Summary

Barteløpet is a charity run platform supporting Movember mental health research. Participants register, complete a virtual 10km run during November, upload proof photos, and engage in a voting contest. The system manages registration, authentication, completion tracking, photo sharing, and voting with full data integrity.

**Key Success Metrics**:
- Unique participant registration with bib numbers
- 100% completion photo capture rate
- Fair, one-vote-per-person voting system
- Zero vote manipulation
- Seamless mobile experience

---

## 1. Functional Requirements

### 1.1 Registration Flow (FR-REG)

#### FR-REG-001: Participant Registration Form
**Priority**: CRITICAL
**Description**: System shall provide a public registration form collecting participant data.

**Input Fields**:
| Field | Type | Required | Validation | Format |
|-------|------|----------|------------|--------|
| Full Name | Text | Yes | Min 2 chars, max 100 chars | Free text |
| Email | Email | Yes | Valid email format, unique | user@domain.tld |
| Postal Address | Text | Yes | Min 10 chars, max 200 chars | Street, postal code, city |
| Phone Number | Tel | No | Valid Norwegian format | +47 XXX XX XXX |

**Business Rules**:
- Email must be unique across all participants
- Form validates on client-side before submission
- Form validates on server-side before database insert
- Postal address required for medal delivery

**Output**:
- Unique bib number generated
- Participant record created in database
- Confirmation email sent
- User redirected to confirmation page showing bib number

#### FR-REG-002: Bib Number Generation
**Priority**: CRITICAL
**Description**: System shall generate unique, sequential bib numbers for participants.

**Algorithm**:
```
1. Query max(bib_number) from participants table
2. If NULL (first participant): bib_number = 1001
3. Else: bib_number = max(bib_number) + 1
4. Ensure uniqueness with database constraint
```

**Constraints**:
- Start at 1001 (professional appearance)
- Sequential integer
- Unique constraint in database
- Thread-safe generation (handle concurrent registrations)

**Format**: 4-digit minimum (1001, 1002, ...)

#### FR-REG-003: Registration Confirmation Email
**Priority**: HIGH
**Description**: System shall send confirmation email immediately upon registration.

**Email Content**:
- Subject: "Velkommen til Barteløpet 2024 - Ditt startnummer: [BIB_NUMBER]"
- Participant name
- Unique bib number prominently displayed
- Event details (10km, November, virtual)
- Donation information (Vipps/bank details)
- Link to dashboard for authentication
- Medal delivery information
- Next steps (complete run, upload photo)

**Delivery Requirements**:
- Send within 30 seconds of registration
- Retry up to 3 times on failure
- Log all email sends
- Handle bounced emails gracefully

### 1.2 Authentication System (FR-AUTH)

#### FR-AUTH-001: Magic Link Authentication
**Priority**: CRITICAL
**Description**: System shall use Supabase Auth magic link for passwordless authentication.

**Flow**:
```
User Action → Email Prompt → Magic Link Sent → Click Link → Authenticated Session
```

**Requirements**:
- Email-based magic link (no passwords)
- Link expires after 1 hour
- One-time use only
- Session persists for 7 days
- Automatic session refresh

**Security**:
- HTTPS only
- Secure token generation (Supabase handles)
- Email verification built-in
- Rate limiting on magic link requests (max 3/hour per email)

#### FR-AUTH-002: Protected Routes
**Priority**: CRITICAL
**Description**: System shall restrict access to authenticated pages.

**Protected Pages**:
- `/dashboard` - User dashboard
- All API routes handling completion/voting

**Behavior**:
- Unauthenticated users redirected to `/login`
- After authentication, redirect to originally requested page
- Show appropriate error messages

#### FR-AUTH-003: User Session Management
**Priority**: HIGH
**Description**: System shall maintain user sessions securely.

**Requirements**:
- Session duration: 7 days default
- Refresh token rotation
- "Remember me" extends to 30 days
- Logout clears all session data
- Concurrent sessions allowed (max 3 devices)

### 1.3 Completion Submission (FR-COMP)

#### FR-COMP-001: Completion Form
**Priority**: CRITICAL
**Description**: Authenticated participants shall submit run completion details.

**Input Fields**:
| Field | Type | Required | Validation | Format |
|-------|------|----------|------------|--------|
| Completion Date | Date | Yes | Within November, not future | YYYY-MM-DD |
| Time/Duration | Text | No | HH:MM:SS or free text | "45:30" or "ca. 50 min" |
| Photo | File | Yes | Image file, max 5MB | JPG, PNG, HEIC, WEBP |
| Comment | Text | No | Max 500 chars | Free text |

**Business Rules**:
- One completion per participant
- Cannot submit before November 1st
- Cannot submit in future
- Photo is mandatory (proof of completion)
- Existing completion can be edited (before voting starts)

**Output**:
- Completion record created
- Photo uploaded to Supabase Storage
- Photo URL stored in database
- Success confirmation displayed

#### FR-COMP-002: Photo Upload
**Priority**: CRITICAL
**Description**: System shall accept and store completion photos securely.

**Technical Requirements**:
- File types: JPG, JPEG, PNG, HEIC, WEBP
- Max size: 5MB per file
- Upload to Supabase Storage bucket: `completion-photos`
- Filename format: `{participant_id}_{timestamp}.{ext}`
- Generate public URL for display

**Processing**:
- Client-side validation (type, size)
- Server-side validation (re-check)
- Virus scanning (if available in Supabase)
- Automatic image optimization (Next.js Image)
- Generate thumbnail (300x300) for gallery grid

**Error Handling**:
- File too large: "Bildet må være under 5MB"
- Invalid type: "Kun bildefiler er tillatt (JPG, PNG)"
- Upload failure: "Opplasting feilet. Prøv igjen."

#### FR-COMP-003: Completion Editing
**Priority**: MEDIUM
**Description**: Participants shall edit their completion before voting period.

**Rules**:
- Edit allowed only if no votes received yet
- Can change: date, time, comment
- Can replace photo (old photo deleted from storage)
- Cannot delete completion once submitted

### 1.4 Photo Gallery & Voting (FR-VOTE)

#### FR-VOTE-001: Photo Gallery Display
**Priority**: HIGH
**Description**: System shall display all completion photos in a responsive grid.

**Layout**:
- Responsive grid (1 col mobile, 2 col tablet, 3-4 col desktop)
- Card format with:
  - Photo (primary, clickable for full view)
  - Participant name
  - Bib number
  - Completion date
  - Comment (if provided)
  - Vote count
  - Heart/vote button (if eligible)

**Sorting Options**:
- Most recent (default)
- Most votes
- Oldest first

**Performance**:
- Lazy loading images
- Infinite scroll or pagination (20 per page)
- Optimized images (Next.js Image component)

#### FR-VOTE-002: Voting System
**Priority**: CRITICAL
**Description**: Registered participants shall vote for one completion photo (not their own).

**Rules**:
- Only registered participants can vote
- Must be authenticated
- One vote per participant (total)
- Cannot vote for own photo
- Vote is final (cannot change)
- Vote count updates in real-time

**Implementation**:
```
1. User clicks heart on a photo
2. Client validates: authenticated, not own photo, hasn't voted
3. Server validates same rules
4. Insert vote record (voter_id, completion_id)
5. Increment vote_count on completion record
6. Return success, disable voting UI
```

**UI States**:
- Not logged in: "Logg inn for å stemme"
- Own photo: Heart icon disabled, "Ditt bidrag"
- Already voted: Heart filled, "Du har stemt"
- Can vote: Heart outlined, clickable

#### FR-VOTE-003: Vote Integrity
**Priority**: CRITICAL
**Description**: System shall prevent vote manipulation.

**Database Constraints**:
- Unique constraint on (voter_id, completion_id)
- Foreign key constraints
- Check constraint: voter_id != participant_id of completion

**Server-Side Validation**:
- Verify user is authenticated
- Verify user is registered participant
- Verify user hasn't voted yet (query votes table)
- Verify not voting for own photo
- Use database transaction for vote + count increment

**Rate Limiting**:
- Max 1 vote attempt per second per user
- Temporary ban (1 hour) after 10 failed attempts

### 1.5 Participant List (FR-LIST)

#### FR-LIST-001: Participant Directory
**Priority**: LOW (Optional feature)
**Description**: System shall display list of all registered participants.

**Display Fields**:
- Name
- Bib number
- Completion status indicator (✓ or -)

**Features**:
- Searchable by name
- Sortable by name, bib number, completion status
- Simple table layout
- Mobile responsive

---

## 2. Non-Functional Requirements

### 2.1 Performance (NFR-PERF)

#### NFR-PERF-001: Page Load Time
**Requirement**: All pages shall load within 3 seconds on 3G mobile connection.

**Metrics**:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Total Blocking Time (TBT): < 200ms

**Implementation**:
- Next.js App Router with SSR/SSG where appropriate
- Code splitting and lazy loading
- Optimized images (WebP, responsive sizes)
- Minimal JavaScript bundle size

#### NFR-PERF-002: Image Optimization
**Requirement**: Images shall be optimized for web delivery.

**Specifications**:
- Use Next.js Image component
- Generate multiple sizes (300w, 640w, 1024w, 1920w)
- Serve WebP format (with fallback)
- Lazy load below-fold images
- Use blur placeholders

#### NFR-PERF-003: Database Query Performance
**Requirement**: Database queries shall execute within 500ms.

**Optimizations**:
- Index on: email (participants), voter_id (votes), completion_id (votes)
- Composite index on (voter_id, completion_id) for votes
- Use SELECT only required columns
- Implement pagination for large result sets

#### NFR-PERF-004: Concurrent User Handling
**Requirement**: System shall handle 500 concurrent users without degradation.

**Capacity Planning**:
- Expected participants: 200-300
- Peak concurrent users: 100-150
- Buffer: 3x peak = 500 concurrent
- Vercel serverless scales automatically

### 2.2 Security (NFR-SEC)

#### NFR-SEC-001: Row Level Security (RLS)
**Requirement**: All database tables shall have RLS policies enabled.

**Policies**:

**participants table**:
```sql
-- Select: All can read (for gallery display)
CREATE POLICY "Public read access" ON participants
  FOR SELECT USING (true);

-- Insert: Anyone can register (then linked to auth user)
CREATE POLICY "Anyone can register" ON participants
  FOR INSERT WITH CHECK (true);

-- Update: Only own record
CREATE POLICY "Users can update own record" ON participants
  FOR UPDATE USING (auth.uid() = user_id);
```

**completions table**:
```sql
-- Select: All can read (for gallery)
CREATE POLICY "Public read access" ON completions
  FOR SELECT USING (true);

-- Insert: Only authenticated users, linked to their participant record
CREATE POLICY "Users can create own completion" ON completions
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM participants WHERE id = participant_id)
  );

-- Update: Only own completion
CREATE POLICY "Users can update own completion" ON completions
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM participants WHERE id = participant_id)
  );
```

**votes table**:
```sql
-- Select: Users can see own votes only
CREATE POLICY "Users can see own votes" ON votes
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM participants WHERE id = voter_id)
  );

-- Insert: Authenticated users, with validation
CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM participants WHERE id = voter_id)
    AND voter_id != (SELECT participant_id FROM completions WHERE id = completion_id)
  );
```

#### NFR-SEC-002: Data Encryption
**Requirement**: All data in transit and at rest shall be encrypted.

**Implementation**:
- HTTPS only (enforce in Vercel)
- Supabase encrypts data at rest (default)
- TLS 1.3 for database connections
- Secure cookies (httpOnly, secure, sameSite)

#### NFR-SEC-003: Input Validation
**Requirement**: All user inputs shall be validated and sanitized.

**Methods**:
- Client-side: Zod schemas for form validation
- Server-side: Re-validate with same schemas
- Sanitize HTML in comments (prevent XSS)
- Parameterized queries (prevent SQL injection)
- File type validation (magic bytes, not just extension)

#### NFR-SEC-004: Authentication Security
**Requirement**: Authentication shall follow OWASP best practices.

**Measures**:
- Magic link (no password to steal)
- One-time use tokens
- Token expiration (1 hour)
- Rate limiting on auth endpoints
- CSRF protection (Next.js built-in)
- Session token rotation

#### NFR-SEC-005: File Upload Security
**Requirement**: File uploads shall be validated and scanned.

**Validation**:
- File type whitelist (images only)
- Magic byte verification
- File size limit (5MB)
- Filename sanitization
- Upload to isolated storage (Supabase Storage)
- No executable files accepted

### 2.3 Usability (NFR-USE)

#### NFR-USE-001: Norwegian Language
**Requirement**: All UI text shall be in Norwegian (Bokmål).

**Scope**:
- All buttons, labels, messages
- Error messages
- Email templates
- SEO metadata

**English**:
- Code comments
- Variable/function names
- Technical documentation

#### NFR-USE-002: Mobile-First Design
**Requirement**: Interface shall be optimized for mobile devices.

**Breakpoints**:
- Mobile: 320px - 640px (primary target)
- Tablet: 641px - 1024px
- Desktop: 1025px+

**Mobile Optimizations**:
- Touch-friendly buttons (min 44x44px)
- Readable font sizes (16px base)
- Minimal scrolling per section
- No hover-dependent interactions
- Bottom navigation for key actions

#### NFR-USE-003: Simple Navigation
**Requirement**: Users shall navigate with minimal cognitive load.

**Structure**:
- Top navigation: Logo, Home, Påmelding, Galleri, Deltakere
- Authenticated: Add "Dashboard" link
- Footer: Contact, Privacy, Social links
- Mobile: Hamburger menu

**Guidelines**:
- Max 5 items in main navigation
- Clear active page indicator
- Breadcrumbs on deep pages
- Back button always works

#### NFR-USE-004: Loading States
**Requirement**: All async operations shall show loading indicators.

**Implementations**:
- Form submission: Spinner on button, disable controls
- Image loading: Skeleton placeholder
- Page transitions: Top progress bar (nprogress)
- Gallery: Shimmer effect for cards

#### NFR-USE-005: Error Messages
**Requirement**: Error messages shall be clear, actionable, in Norwegian.

**Format**:
- What happened
- Why it happened (if clear)
- What user can do next

**Examples**:
- "E-postadressen er allerede registrert. [Logg inn]"
- "Bildet er for stort (7.2MB). Maksimal størrelse er 5MB."
- "Du kan kun stemme på ett bilde. Du har allerede stemt."

### 2.4 Scalability (NFR-SCALE)

#### NFR-SCALE-001: Participant Growth
**Requirement**: System shall support 1000+ participants without re-architecture.

**Current Scale**: 200-300 expected
**Design for**: 1000 participants
**Max capacity**: 5000 participants (before optimization needed)

**Considerations**:
- Database indexes handle this scale
- Supabase free tier: 500MB database (sufficient)
- Image storage: 1GB free (200 photos @ 5MB each = 1GB)

#### NFR-SCALE-002: Storage Management
**Requirement**: System shall manage storage limits proactively.

**Image Storage Budget**:
- Free tier: 1GB
- Expected: 300 participants * 2MB avg = 600MB
- Buffer: 40% remaining

**Monitoring**:
- Track total storage used
- Alert at 80% capacity
- Implement image compression if needed

#### NFR-SCALE-003: Concurrent Voting
**Requirement**: System shall handle voting rush (e.g., last day).

**Scenario**: 200 users voting within 1 hour
- Supabase concurrent connections: 60 (free tier)
- Connection pooling via pgBouncer (built-in)
- Serverless functions scale automatically

**Load Testing**: Simulate 100 concurrent votes before launch

---

## 3. Data Requirements

### 3.1 Database Schema

#### Table: participants

```sql
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  address TEXT NOT NULL CHECK (char_length(address) >= 10 AND char_length(address) <= 200),
  phone TEXT CHECK (phone IS NULL OR phone ~* '^\+?47[0-9]{8}$'),
  bib_number INTEGER NOT NULL UNIQUE CHECK (bib_number >= 1001),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Indexes
  CONSTRAINT participants_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX participants_email_idx ON participants(email);
CREATE UNIQUE INDEX participants_bib_number_idx ON participants(bib_number);
CREATE INDEX participants_user_id_idx ON participants(user_id);
```

**Field Specifications**:

| Field | Type | Nullable | Default | Constraints | Purpose |
|-------|------|----------|---------|-------------|---------|
| id | UUID | No | gen_random_uuid() | Primary key | Unique identifier |
| created_at | TIMESTAMPTZ | No | now() | - | Registration timestamp |
| name | TEXT | No | - | Length 2-100 | Participant full name |
| email | TEXT | No | - | Unique, email format | Contact & auth |
| address | TEXT | No | - | Length 10-200 | Medal delivery address |
| phone | TEXT | Yes | NULL | Norwegian format | Optional contact |
| bib_number | INTEGER | No | - | Unique, >= 1001 | Runner identification |
| user_id | UUID | Yes | NULL | FK to auth.users | Links to Supabase Auth |

**Business Rules**:
- Email must be unique (enforced by unique index)
- Bib number auto-generated starting at 1001
- User_id linked after email verification (magic link)
- Phone is optional but validated if provided
- Address required for physical medal delivery

#### Table: completions

```sql
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL CHECK (
    completion_date >= '2024-11-01' AND
    completion_date <= '2024-11-30' AND
    completion_date <= CURRENT_DATE
  ),
  time_duration TEXT,
  photo_url TEXT NOT NULL CHECK (photo_url ~* '^https://.*\.(jpg|jpeg|png|webp)$'),
  comment TEXT CHECK (char_length(comment) <= 500),
  vote_count INTEGER NOT NULL DEFAULT 0 CHECK (vote_count >= 0),

  -- One completion per participant
  CONSTRAINT completions_participant_unique UNIQUE (participant_id)
);

CREATE UNIQUE INDEX completions_participant_id_idx ON completions(participant_id);
CREATE INDEX completions_vote_count_idx ON completions(vote_count DESC);
CREATE INDEX completions_created_at_idx ON completions(created_at DESC);
```

**Field Specifications**:

| Field | Type | Nullable | Default | Constraints | Purpose |
|-------|------|----------|---------|-------------|---------|
| id | UUID | No | gen_random_uuid() | Primary key | Unique identifier |
| created_at | TIMESTAMPTZ | No | now() | - | Submission timestamp |
| participant_id | UUID | No | - | FK, Unique | Links to participant |
| completion_date | DATE | No | - | November only, not future | When run completed |
| time_duration | TEXT | Yes | NULL | - | Run duration (flexible format) |
| photo_url | TEXT | No | - | HTTPS URL, image extension | Proof photo |
| comment | TEXT | Yes | NULL | Max 500 chars | Optional story |
| vote_count | INTEGER | No | 0 | >= 0 | Cached vote count |

**Business Rules**:
- One completion per participant (unique constraint)
- Completion date must be in November and not future
- Photo is mandatory (proof of completion)
- Vote_count denormalized for performance (updated by trigger)
- Comment is optional, max 500 characters

#### Table: votes

```sql
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  voter_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  completion_id UUID NOT NULL REFERENCES completions(id) ON DELETE CASCADE,

  -- One vote per participant, cannot vote for self
  CONSTRAINT votes_voter_completion_unique UNIQUE (voter_id, completion_id),
  CONSTRAINT votes_no_self_vote CHECK (
    voter_id != (SELECT participant_id FROM completions WHERE id = completion_id)
  )
);

CREATE UNIQUE INDEX votes_voter_completion_idx ON votes(voter_id, completion_id);
CREATE INDEX votes_completion_id_idx ON votes(completion_id);
CREATE INDEX votes_voter_id_idx ON votes(voter_id);
```

**Field Specifications**:

| Field | Type | Nullable | Default | Constraints | Purpose |
|-------|------|----------|---------|-------------|---------|
| id | UUID | No | gen_random_uuid() | Primary key | Unique identifier |
| created_at | TIMESTAMPTZ | No | now() | - | Vote timestamp |
| voter_id | UUID | No | - | FK to participants | Who voted |
| completion_id | UUID | No | - | FK to completions | What they voted for |

**Business Rules**:
- One vote per participant total (enforced by unique constraint)
- Cannot vote for own completion (check constraint)
- Votes are final (no updates or deletes via UI)
- Cascading deletes maintain referential integrity

### 3.2 Database Triggers

#### Trigger: Update vote_count on completions

```sql
-- Function to increment vote count
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE completions
  SET vote_count = vote_count + 1
  WHERE id = NEW.completion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on vote insert
CREATE TRIGGER on_vote_insert
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION increment_vote_count();

-- Function to decrement vote count (for admin deletion)
CREATE OR REPLACE FUNCTION decrement_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE completions
  SET vote_count = vote_count - 1
  WHERE id = OLD.completion_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on vote delete
CREATE TRIGGER on_vote_delete
  AFTER DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_vote_count();
```

### 3.3 Supabase Storage Buckets

#### Bucket: completion-photos

**Configuration**:
```json
{
  "id": "completion-photos",
  "name": "completion-photos",
  "public": true,
  "file_size_limit": 5242880,
  "allowed_mime_types": [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic"
  ]
}
```

**RLS Policies**:
```sql
-- Anyone can view photos (public gallery)
CREATE POLICY "Public read access" ON storage.objects FOR SELECT
  USING (bucket_id = 'completion-photos');

-- Only authenticated users can upload
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'completion-photos'
    AND auth.role() = 'authenticated'
  );

-- Users can update/delete own photos
CREATE POLICY "Users can manage own photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'completion-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

**File Naming Convention**:
```
{participant_id}/{timestamp}_{original_name}.{ext}

Example:
a7b3c4d5-e6f7-8901-2345-67890abcdef1/1699012345_run_screenshot.jpg
```

### 3.4 Data Validation Rules

#### Participant Data Validation

```typescript
import { z } from 'zod';

export const participantSchema = z.object({
  name: z.string()
    .min(2, 'Navn må være minst 2 tegn')
    .max(100, 'Navn kan ikke være mer enn 100 tegn')
    .regex(/^[a-zA-ZæøåÆØÅ\s\-\.]+$/, 'Ugyldig navn'),

  email: z.string()
    .email('Ugyldig e-postadresse')
    .max(255, 'E-postadresse er for lang')
    .toLowerCase(),

  address: z.string()
    .min(10, 'Adresse må være minst 10 tegn')
    .max(200, 'Adresse kan ikke være mer enn 200 tegn'),

  phone: z.string()
    .regex(/^\+?47[0-9]{8}$/, 'Ugyldig telefonnummer')
    .optional()
    .or(z.literal(''))
});
```

#### Completion Data Validation

```typescript
export const completionSchema = z.object({
  completion_date: z.date()
    .min(new Date('2024-11-01'), 'Løpet må være gjennomført i november')
    .max(new Date('2024-11-30'), 'Løpet må være gjennomført i november')
    .max(new Date(), 'Dato kan ikke være i fremtiden'),

  time_duration: z.string()
    .max(50, 'Tid er for lang')
    .optional(),

  photo: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, 'Bildet må være under 5MB')
    .refine(
      file => ['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.type),
      'Kun bildefiler er tillatt'
    ),

  comment: z.string()
    .max(500, 'Kommentar kan ikke være mer enn 500 tegn')
    .optional()
    .or(z.literal(''))
});
```

### 3.5 Data Relationships

```
auth.users (Supabase Auth)
    ↓ (1:1)
participants
    ↓ (1:1)
completions
    ↑
votes ← (many:1) → participants (as voters)
```

**Relationship Rules**:
- One auth.user to one participant (via user_id)
- One participant to one completion (unique constraint)
- One participant to many votes as voter (can only vote once total)
- One completion to many votes (receives votes)
- Participant cannot vote for own completion

---

## 4. Integration Requirements

### 4.1 Supabase Setup (INT-SB)

#### INT-SB-001: Project Initialization

**Steps**:
1. Create new Supabase project
   - Project name: "bartelopet"
   - Region: Europe (closest to Norway)
   - Database password: Strong, stored in password manager

2. Configure project settings
   - Enable email auth (magic link)
   - Disable password auth
   - Configure email templates (Norwegian)
   - Set site URL: https://bartelopet.vercel.app

3. Set up database
   - Run SQL migrations for tables
   - Enable RLS on all tables
   - Create RLS policies
   - Create indexes
   - Create triggers

4. Configure storage
   - Create `completion-photos` bucket
   - Set as public
   - Configure file size limit (5MB)
   - Set allowed MIME types
   - Create RLS policies

#### INT-SB-002: Environment Variables

**Required Variables**:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# App
NEXT_PUBLIC_APP_URL=https://bartelopet.vercel.app
NEXT_PUBLIC_APP_NAME=Barteløpet

# Email (if custom SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=[username]
SMTP_PASS=[password]
SMTP_FROM=noreply@bartelopet.no
```

**Security**:
- Never commit `.env` files
- Use Vercel environment variables for production
- Service role key only on server-side
- Anon key safe for client-side

#### INT-SB-003: Email Configuration

**Magic Link Email Template** (Norwegian):
```html
<h2>Velkommen til Barteløpet!</h2>
<p>Klikk på lenken under for å logge inn:</p>
<p><a href="{{ .ConfirmationURL }}">Logg inn</a></p>
<p>Denne lenken er gyldig i 1 time.</p>
<p>Hvis du ikke har bedt om denne e-posten, kan du ignorere den.</p>
```

**Confirmation Email Template** (Custom, sent after registration):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .bib-number { font-size: 48px; font-weight: bold; color: #2563eb; text-align: center; margin: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Velkommen til Barteløpet 2024!</h1>

    <p>Hei {{ name }},</p>

    <p>Takk for at du meldte deg på Barteløpet! Her er ditt startnummer:</p>

    <div class="bib-number">{{ bib_number }}</div>

    <h3>Neste steg:</h3>
    <ol>
      <li><strong>Doner:</strong> Vipps til [nummer] eller overføring til [kontonummer]</li>
      <li><strong>Løp:</strong> Gjennomfør 10 km i Stavanger når det passer deg i november</li>
      <li><strong>Last opp:</strong> Logg inn og last opp bilde fra løpet</li>
      <li><strong>Stem:</strong> Stem på favorittbildet ditt i galleriet</li>
    </ol>

    <p style="text-align: center; margin: 30px 0;">
      <a href="{{ dashboard_url }}" class="button">Gå til ditt dashboard</a>
    </p>

    <p><strong>Adresse for medalje:</strong><br>{{ address }}</p>

    <p>Vi gleder oss til å se ditt bilde!</p>

    <p>Mvh,<br>Barteløpet-teamet</p>
  </div>
</body>
</html>
```

### 4.2 Vercel Deployment (INT-VERCEL)

#### INT-VERCEL-001: Project Setup

**Configuration**:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

**Build Settings**:
- Node version: 18.x
- Next.js version: 14.x
- Automatic deployments from `main` branch
- Preview deployments from PRs

#### INT-VERCEL-002: Environment Variables

**Production Environment**:
- Add all variables from `.env.local`
- Mark sensitive variables as "Encrypted"
- Set `NEXT_PUBLIC_APP_URL` to production domain

**Preview Environment**:
- Use same Supabase project (or separate staging project)
- Different `NEXT_PUBLIC_APP_URL` (auto-generated by Vercel)

#### INT-VERCEL-003: Domain Configuration

**Custom Domain** (if applicable):
- Primary: bartelopet.no
- Redirects: www.bartelopet.no → bartelopet.no

**SSL**:
- Automatic SSL certificate via Vercel
- Force HTTPS (enabled by default)

### 4.3 External Services (INT-EXT)

#### INT-EXT-001: Email Service

**Options**:
1. **Supabase Auth Email** (Default, recommended)
   - Built-in, no setup needed
   - Limited to auth emails only
   - 3 emails per hour per recipient (rate limit)

2. **Custom SMTP** (For confirmation emails)
   - SendGrid (100 emails/day free tier)
   - Resend (100 emails/day free tier)
   - Mailgun (5,000 emails/month free)

**Recommendation**: Supabase Auth for magic links + Resend for custom emails

#### INT-EXT-002: Analytics (Optional)

**Options**:
- Vercel Analytics (built-in, recommended)
- Plausible (privacy-friendly)
- Google Analytics (if required)

**Metrics to Track**:
- Page views per route
- Registration conversion rate
- Completion submission rate
- Voting participation rate
- Bounce rate

---

## 5. User Stories & Journeys

### 5.1 User Story 1: New Participant Registration

**As a** potential participant
**I want to** register for Barteløpet
**So that** I can receive a bib number and participate in the event

**Acceptance Criteria**:
- [ ] Registration form accessible from homepage
- [ ] Form validates all inputs before submission
- [ ] Unique bib number generated upon successful registration
- [ ] Confirmation email sent within 30 seconds
- [ ] User redirected to confirmation page showing bib number
- [ ] Bib number displayed prominently
- [ ] Next steps clearly explained

**User Journey**:
```
1. User lands on homepage
   ↓
2. Reads about event and cause
   ↓
3. Clicks "Meld deg på" CTA button
   ↓
4. Fills out registration form
   - Name: "Ola Nordmann"
   - Email: "ola@example.com"
   - Address: "Storgata 1, 4000 Stavanger"
   - Phone: "+4712345678" (optional)
   ↓
5. Clicks "Registrer" button
   ↓
6. Form validates (client-side)
   - Success: Continues
   - Error: Shows error messages, user corrects
   ↓
7. Submission sent to server
   - Loading spinner shown
   ↓
8. Server validates and creates participant
   - Bib number: 1001
   - Database record created
   - Confirmation email queued
   ↓
9. Redirected to confirmation page
   - "Takk for påmeldingen!"
   - Bib number displayed: 1001
   - Next steps listed
   - Link to dashboard (requires login)
   ↓
10. User receives confirmation email
    - Opens email
    - Sees bib number and instructions
    - Bookmarks dashboard link
```

**Edge Cases**:
- Email already registered → Show error, offer login
- Server error during registration → Show friendly error, retry button
- Email delivery fails → Log error, show bib number anyway, offer to resend

### 5.2 User Story 2: Authentication & First Login

**As a** registered participant
**I want to** log in to my dashboard
**So that** I can submit my run completion

**Acceptance Criteria**:
- [ ] Login page accessible via navigation or direct link
- [ ] Email input validates email format
- [ ] Magic link sent upon request
- [ ] User receives email within 30 seconds
- [ ] Magic link works and authenticates user
- [ ] User redirected to dashboard after authentication
- [ ] Session persists for 7 days

**User Journey**:
```
1. User clicks "Dashboard" in navigation
   ↓
2. Redirected to /login (not authenticated)
   ↓
3. Enters email: "ola@example.com"
   ↓
4. Clicks "Send magic link"
   ↓
5. Form validates email format
   - Success: Continues
   - Error: Shows "Ugyldig e-postadresse"
   ↓
6. Request sent to Supabase Auth
   - Loading state shown
   ↓
7. Magic link email sent
   ↓
8. Confirmation shown: "Sjekk e-posten din!"
   ↓
9. User opens email inbox
   ↓
10. Finds "Logg inn til Barteløpet" email
    ↓
11. Clicks magic link in email
    ↓
12. Browser opens to app
    - Token validated by Supabase
    - Session created
    ↓
13. Redirected to /dashboard
    - Authenticated
    - Dashboard loads with user data
```

**Edge Cases**:
- Email not registered → Show error "E-postadressen er ikke registrert. [Meld deg på]"
- Expired magic link → Show error, offer to send new link
- Link already used → Show error, offer to send new link
- Rate limit exceeded → Show error "For mange forsøk. Prøv igjen om 10 minutter"

### 5.3 User Story 3: Run Completion Submission

**As an** authenticated participant
**I want to** submit my run completion with a photo
**So that** my participation is recorded and I can compete in the photo contest

**Acceptance Criteria**:
- [ ] Dashboard shows completion form
- [ ] Form accepts date, time, photo, and comment
- [ ] Photo upload validates file type and size
- [ ] Date validation prevents future dates and non-November dates
- [ ] Submission creates completion record and uploads photo
- [ ] Success confirmation shown with preview
- [ ] User can edit submission before voting starts
- [ ] Completion appears in gallery immediately

**User Journey**:
```
1. User logs in to dashboard
   ↓
2. Sees completion form (if not already submitted)
   - OR sees existing completion (if already submitted)
   ↓
3. Fills out form:
   - Completion Date: 2024-11-15
   - Time: "52:30"
   - Photo: Selects file from device
   - Comment: "Fantastisk løp i regnvær! Motivert av viktigheten av mental helse."
   ↓
4. Form validates:
   - Date: ✓ In November, not future
   - Photo: ✓ 2.3MB, JPEG
   - Comment: ✓ 87 characters
   ↓
5. Clicks "Lagre"
   ↓
6. Photo upload begins
   - Progress bar shown
   ↓
7. Server receives submission:
   - Validates date (server-side)
   - Validates photo (server-side)
   - Uploads photo to Supabase Storage
   - Creates completion record in database
   - Links photo URL to completion
   ↓
8. Success response:
   - "Takk for innsendingen!"
   - Preview of submission shown
   - Photo displayed
   - "Se i galleriet" button
   ↓
9. User clicks "Se i galleriet"
   ↓
10. Redirected to /galleri
    - User's photo appears in grid
    - Marked as "Ditt bidrag" (cannot vote for own)
```

**Edge Cases**:
- Photo too large (6MB) → Client rejects: "Bildet må være under 5MB. Prøv å komprimere det."
- Wrong file type (PDF) → Client rejects: "Kun bildefiler er tillatt"
- Already submitted → Form replaced with preview, "Rediger" button shown
- Upload fails → Retry logic (3 attempts), then error message
- Date in December → Validation error: "Løpet må være gjennomført i november"

### 5.4 User Story 4: Photo Gallery Browsing

**As a** visitor (authenticated or not)
**I want to** view all completion photos
**So that** I can see participants' runs and be inspired

**Acceptance Criteria**:
- [ ] Gallery accessible to all visitors
- [ ] Photos displayed in responsive grid
- [ ] Each card shows photo, name, date, comment, vote count
- [ ] Gallery loads quickly with lazy loading
- [ ] Sorting options available (recent, most votes)
- [ ] Mobile-optimized layout

**User Journey**:
```
1. User navigates to /galleri (from nav or homepage link)
   ↓
2. Gallery page loads:
   - Hero section: "Fullførte løp"
   - Sort dropdown: "Nyeste" (default)
   - Grid of photo cards begins loading
   ↓
3. First 20 photos load:
   - Skeleton placeholders replaced with actual photos
   - Each card shows:
     * Photo (lazy loaded)
     * "Ola Nordmann (#1001)"
     * "15. november 2024"
     * Comment (if provided)
     * Heart icon + vote count
   ↓
4. User scrolls down:
   - Next 20 photos lazy load
   - Smooth scrolling experience
   ↓
5. User clicks sort: "Mest stemmer"
   - Gallery re-fetches sorted data
   - Cards re-render with new order
   ↓
6. User clicks on a photo:
   - Modal opens with full-size image
   - Shows all details
   - Close button returns to gallery
```

**Edge Cases**:
- No completions yet → Show message: "Ingen har fullført ennå. Vær den første!"
- Slow connection → Skeleton loaders remain until photos load
- Image fails to load → Show placeholder with camera icon
- Many photos (100+) → Pagination shown, 20 per page

### 5.5 User Story 5: Voting for a Photo

**As a** registered participant
**I want to** vote for one photo
**So that** I can support my favorite submission

**Acceptance Criteria**:
- [ ] Heart button visible on each photo card
- [ ] Clicking heart submits vote
- [ ] Cannot vote for own photo
- [ ] Can only vote once (total, not per photo)
- [ ] Vote count updates immediately after voting
- [ ] Heart icon changes to filled state after voting
- [ ] Cannot change vote once submitted

**User Journey**:
```
1. User (authenticated, registered) browses /galleri
   ↓
2. Sees multiple photo cards:
   - Own photo: Heart greyed out, tooltip "Du kan ikke stemme på ditt eget bilde"
   - Other photos: Heart outlined, clickable
   ↓
3. User finds favorite photo:
   - "Kari Hansen (#1042)"
   - Photo shows beautiful coastal run
   - Comment: "Løp langs Solastranden. Fantastisk utsikt!"
   ↓
4. User hovers heart icon:
   - Tooltip: "Stem på dette bildet"
   ↓
5. User clicks heart:
   - Optimistic UI: Heart fills immediately
   - Vote count increments: 5 → 6
   ↓
6. Server processes vote:
   - Validates: User is authenticated
   - Validates: User is registered participant
   - Validates: User hasn't voted yet
   - Validates: Not voting for own photo
   - Inserts vote record
   - Increments vote_count on completion
   ↓
7. Success response:
   - UI remains in voted state
   - Toast notification: "Stemme registrert!"
   ↓
8. User browses other photos:
   - All other hearts now greyed out
   - Tooltip: "Du har allerede stemt"
   ↓
9. User refreshes page:
   - Vote persists (from database)
   - Kari's photo shows filled heart and count 6
```

**Edge Cases**:
- Not logged in → Clicking heart shows: "Logg inn for å stemme" with login button
- Not registered → Clicking heart shows: "Du må være påmeldt for å stemme"
- Already voted → Heart greyed out, tooltip: "Du har allerede stemt"
- Own photo → Heart greyed out, tooltip: "Du kan ikke stemme på ditt eget bilde"
- Network error → Show error toast: "Kunne ikke registrere stemme. Prøv igjen."
- Race condition (rapid clicks) → Database unique constraint prevents duplicate, show friendly error

### 5.6 User Story 6: Viewing Own Dashboard

**As a** registered participant
**I want to** view my dashboard
**So that** I can see my bib number, submission status, and participation stats

**Acceptance Criteria**:
- [ ] Dashboard shows bib number prominently
- [ ] Shows completion status (submitted or not)
- [ ] If submitted: shows preview and edit option
- [ ] If not submitted: shows completion form
- [ ] Shows voting status (voted or not)
- [ ] Mobile-friendly layout

**User Journey**:
```
1. User logs in and navigates to /dashboard
   ↓
2. Dashboard loads with personalized data:

   Header Section:
   - "Velkommen, Ola Nordmann!"
   - Bib number: Large display "1001"
   - Downloadable bib image (optional feature)

   Completion Section:
   - If not submitted:
     * "Fullføringsregistrering"
     * Form to submit completion
   - If submitted:
     * "Ditt løp"
     * Preview of photo and details
     * "Rediger" button (if no votes yet)
     * "Se i galleriet" button

   Voting Section:
   - If not voted:
     * "Stem på ditt favorittbilde"
     * "Gå til galleri" button
   - If voted:
     * "Du har stemt på:"
     * Small preview of voted photo
     * Link to view in gallery

   Stats Section (nice-to-have):
   - Total participants
   - Completions count
   - Your ranking by votes (if applicable)
```

**Edge Cases**:
- First login, no submission → Encourage completion with prominent form
- Submitted but no votes yet → Allow editing
- Submitted with votes → Show view-only preview, disable editing
- Voted → Show which photo user voted for

---

## 6. Edge Cases & Constraints

### 6.1 Registration Edge Cases (EDGE-REG)

#### EDGE-REG-001: Duplicate Email Registration
**Scenario**: User tries to register with an email already in database.

**Expected Behavior**:
- Server returns 409 Conflict
- Error message: "E-postadressen er allerede registrert. [Logg inn]"
- "Logg inn" is a link to /login with email pre-filled

**Implementation**:
```typescript
// In registration API route
try {
  await supabase.from('participants').insert(data);
} catch (error) {
  if (error.code === '23505') { // Unique violation
    return { error: 'Email already registered', code: 'DUPLICATE_EMAIL' };
  }
  throw error;
}
```

#### EDGE-REG-002: Concurrent Bib Number Generation
**Scenario**: Two users register at exactly the same time.

**Problem**: Both might get the same bib number if not handled atomically.

**Solution**: Database-level sequence or transaction with row lock.

**Implementation**:
```sql
-- Option 1: Use a sequence
CREATE SEQUENCE bib_number_seq START 1001;
ALTER TABLE participants ALTER COLUMN bib_number
  SET DEFAULT nextval('bib_number_seq');

-- Option 2: Transaction with row lock
BEGIN;
SELECT bib_number FROM participants
  ORDER BY bib_number DESC LIMIT 1 FOR UPDATE;
-- Calculate next number in application
INSERT INTO participants (bib_number, ...) VALUES (next_bib, ...);
COMMIT;
```

#### EDGE-REG-003: Invalid Characters in Name
**Scenario**: User enters special characters, numbers, or emojis in name.

**Expected Behavior**:
- Client validation rejects: "Navnet kan kun inneholde bokstaver, mellomrom, bindestrek og punktum"
- Accepted: "Ole-Martin Hansen", "Dr. Hansen", "Anne-Karin Østby"
- Rejected: "John123", "User!!", "😀 Name"

**Regex**: `/^[a-zA-ZæøåÆØÅ\s\-\.]+$/`

#### EDGE-REG-004: Address Format Variations
**Scenario**: Users enter addresses in different formats.

**Accepted Variations**:
- "Storgata 1, 4000 Stavanger"
- "Storgata 1\n4000 Stavanger"
- "Storgata 1 Leilighet 23, 4000 Stavanger"

**Validation**: Minimum 10 characters (covers "Oslo, 0000")

**No strict format** enforced (too complex for Norwegian addresses).

#### EDGE-REG-005: Email Delivery Failure
**Scenario**: Confirmation email fails to send (invalid email, server down, etc.).

**Expected Behavior**:
- Registration still succeeds (email is not critical)
- Log error for admin review
- Show bib number on confirmation page anyway
- Offer "Resend confirmation email" button

**Retry Logic**:
- Attempt 1: Immediate
- Attempt 2: After 30 seconds
- Attempt 3: After 2 minutes
- After 3 failures: Log and continue

### 6.2 Authentication Edge Cases (EDGE-AUTH)

#### EDGE-AUTH-001: Expired Magic Link
**Scenario**: User clicks magic link after 1 hour expiration.

**Expected Behavior**:
- Redirect to /login
- Error message: "Lenken har utløpt. Klikk under for å få en ny."
- Email pre-filled if available in URL params
- "Send ny lenke" button

#### EDGE-AUTH-002: Already Used Magic Link
**Scenario**: User clicks magic link twice (e.g., from different devices).

**Expected Behavior**:
- First click: Authenticates successfully
- Second click: Error "Lenken er allerede brukt. Logg inn eller be om en ny lenke."

#### EDGE-AUTH-003: Email Not Registered
**Scenario**: User tries to log in with email not in participants table.

**Expected Behavior**:
- Error message: "E-postadressen er ikke registrert. [Meld deg på]"
- "Meld deg på" links to /pamelding with email pre-filled

**Implementation**:
```typescript
// Before sending magic link, verify email exists
const { data: participant } = await supabase
  .from('participants')
  .select('email')
  .eq('email', email)
  .single();

if (!participant) {
  return { error: 'Email not registered', code: 'NOT_REGISTERED' };
}

// Then send magic link via Supabase Auth
```

#### EDGE-AUTH-004: Session Expiry Mid-Use
**Scenario**: User's session expires while filling out completion form.

**Expected Behavior**:
- Form submission fails with 401
- Show modal: "Din økt har utløpt. Logg inn igjen for å fortsette."
- On re-authentication, restore form data (via localStorage)
- Submit form automatically after login

### 6.3 Completion Submission Edge Cases (EDGE-COMP)

#### EDGE-COMP-001: Photo Over 5MB
**Scenario**: User selects a 7MB photo.

**Expected Behavior**:
- Client-side validation rejects immediately
- Error message: "Bildet er for stort (7.0 MB). Maksimal størrelse er 5 MB."
- Suggestion: "Prøv å komprimere bildet eller velg et mindre bilde."
- Show link to image compression tool (optional)

#### EDGE-COMP-002: Unsupported File Type
**Scenario**: User tries to upload a PDF, video, or non-image file.

**Expected Behavior**:
- Client-side validation rejects
- Error message: "Kun bildefiler er tillatt (JPG, PNG, WEBP)."
- File input resets

**Magic Bytes Validation** (server-side):
```typescript
// Verify actual file type, not just extension
const fileBuffer = await file.arrayBuffer();
const uint8Array = new Uint8Array(fileBuffer);

const signatures = {
  jpg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46]
};

// Check if file starts with valid signature
```

#### EDGE-COMP-003: Slow Upload on Mobile
**Scenario**: User on 3G uploads 4MB photo (takes 30+ seconds).

**Expected Behavior**:
- Show progress bar during upload
- Allow cancellation
- Disable form controls during upload
- Show estimated time remaining
- Timeout after 2 minutes, allow retry

#### EDGE-COMP-004: Duplicate Submission Attempt
**Scenario**: User already submitted, tries to submit again via API.

**Expected Behavior**:
- Database unique constraint prevents duplicate
- API returns 409 Conflict
- Error message: "Du har allerede sendt inn ditt løp. [Se innsendt]"

**RLS Policy** also prevents this:
```sql
CREATE POLICY "One completion per participant" ON completions
  FOR INSERT WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM completions
      WHERE participant_id = NEW.participant_id
    )
  );
```

#### EDGE-COMP-005: Editing After Votes Received
**Scenario**: User tries to edit completion after receiving votes.

**Expected Behavior**:
- Check vote count before allowing edit
- If vote_count > 0: Disable edit, show message "Kan ikke redigere etter at andre har stemt"
- If vote_count = 0: Allow edit

**API Validation**:
```typescript
const { data: completion } = await supabase
  .from('completions')
  .select('vote_count')
  .eq('id', completionId)
  .single();

if (completion.vote_count > 0) {
  return { error: 'Cannot edit after receiving votes' };
}
```

#### EDGE-COMP-006: Date Outside November
**Scenario**: User selects a date in October or December.

**Expected Behavior**:
- Client validation: Restrict date picker to November 1-30
- Server validation: Reject with error "Fullføringsdato må være i november"

**Edge Case**: What if event runs in December too?
- Solution: Make date range configurable in environment variable

#### EDGE-COMP-007: Future Date Submission
**Scenario**: User selects tomorrow's date.

**Expected Behavior**:
- Client validation: Disable future dates in date picker
- Server validation: Reject with error "Dato kan ikke være i fremtiden"

**Database Constraint**:
```sql
CHECK (completion_date <= CURRENT_DATE)
```

### 6.4 Voting Edge Cases (EDGE-VOTE)

#### EDGE-VOTE-001: Voting for Own Photo
**Scenario**: User tries to vote for their own completion (via API).

**Expected Behavior**:
- UI prevents this (heart greyed out)
- API also validates and rejects
- Error message: "Du kan ikke stemme på ditt eget bilde"

**Database Constraint**:
```sql
CONSTRAINT votes_no_self_vote CHECK (
  voter_id != (SELECT participant_id FROM completions WHERE id = completion_id)
)
```

#### EDGE-VOTE-002: Double Voting (Race Condition)
**Scenario**: User clicks vote button multiple times rapidly.

**Expected Behavior**:
- First click: Optimistic UI update, disable button
- Subsequent clicks: No action (button disabled)
- Database unique constraint catches any duplicates
- If duplicate detected server-side: Return 409, but show as success (already voted)

**Implementation**:
```typescript
// Client-side
const [hasVoted, setHasVoted] = useState(false);
const [isVoting, setIsVoting] = useState(false);

const handleVote = async () => {
  if (isVoting || hasVoted) return; // Guard

  setIsVoting(true);
  setHasVoted(true); // Optimistic

  try {
    await submitVote(completionId);
  } catch (error) {
    if (error.code === 'DUPLICATE_VOTE') {
      // Already voted, keep UI as voted
    } else {
      setHasVoted(false); // Revert
      showError();
    }
  } finally {
    setIsVoting(false);
  }
};
```

#### EDGE-VOTE-003: Voting Without Registration
**Scenario**: Someone authenticates with Supabase but doesn't have a participant record.

**This shouldn't happen** if registration flow is correct, but as safety:

**Prevention**:
- After magic link auth, check if user has participant record
- If not: Show "Du må være påmeldt for å bruke dashboardet. [Meld deg på]"

**Vote API Validation**:
```typescript
// Ensure voter exists in participants table
const { data: participant } = await supabase
  .from('participants')
  .select('id')
  .eq('user_id', userId)
  .single();

if (!participant) {
  return { error: 'Must be registered participant to vote' };
}
```

#### EDGE-VOTE-004: Changing Vote
**Scenario**: User wants to change their vote after submitting.

**Policy Decision**: **No vote changes allowed** (simplifies logic, fairness).

**Expected Behavior**:
- No "change vote" option in UI
- Voted photo's heart remains filled
- All other hearts remain greyed out
- Tooltip: "Du har allerede stemt. Stemmer kan ikke endres."

**Future Enhancement**: If vote changes are desired:
- Implement vote update (not delete + insert)
- Update vote_count on both completions (decrement old, increment new)
- Add audit log

#### EDGE-VOTE-005: Vote Count Inconsistency
**Scenario**: Vote count on completion doesn't match actual votes in votes table.

**Causes**:
- Failed trigger execution
- Manual data manipulation
- Database replication lag

**Detection**:
```sql
-- Admin query to find inconsistencies
SELECT c.id, c.vote_count, COUNT(v.id) AS actual_count
FROM completions c
LEFT JOIN votes v ON v.completion_id = c.id
GROUP BY c.id, c.vote_count
HAVING c.vote_count != COUNT(v.id);
```

**Prevention**:
- Use database triggers (defined in schema)
- Periodic reconciliation job (cron)

**Reconciliation**:
```sql
-- Fix inconsistencies (run as admin)
UPDATE completions c
SET vote_count = (
  SELECT COUNT(*) FROM votes WHERE completion_id = c.id
);
```

### 6.5 Storage Edge Cases (EDGE-STORAGE)

#### EDGE-STORAGE-001: Storage Quota Exceeded
**Scenario**: Storage bucket reaches 1GB limit (free tier).

**Expected Behavior**:
- Upload fails with 507 Insufficient Storage
- Show user-friendly error: "Vi har dessverre nådd lagringsgrensen. Kontakt arrangøren."
- Admin notified via alert

**Prevention**:
- Monitor storage usage (Supabase dashboard)
- Alert at 80% capacity
- Consider upgrading plan or compressing images

#### EDGE-STORAGE-002: Photo Upload Fails Mid-Upload
**Scenario**: Network drops during upload, upload incomplete.

**Expected Behavior**:
- Detect upload failure (timeout or error event)
- Show error: "Opplasting feilet. Sjekk internettforbindelsen din."
- Offer "Prøv igjen" button
- Do not create completion record (upload is prerequisite)

**Implementation**:
```typescript
try {
  const { data, error } = await supabase.storage
    .from('completion-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const photoUrl = getPublicUrl(filePath);

  // Now create completion record
  await supabase.from('completions').insert({
    photo_url: photoUrl,
    ...otherData
  });

} catch (error) {
  // Cleanup: Delete partial upload if exists
  await supabase.storage
    .from('completion-photos')
    .remove([filePath]);

  return { error: 'Upload failed' };
}
```

#### EDGE-STORAGE-003: Orphaned Files
**Scenario**: Photo uploaded but completion record creation fails.

**Problem**: File exists in storage but no database reference.

**Prevention**:
- Upload photo first, get URL
- Create completion record with photo URL
- If record creation fails: Delete uploaded photo (cleanup)

**Periodic Cleanup**:
```typescript
// Admin script: Find orphaned files
const { data: files } = await supabase.storage
  .from('completion-photos')
  .list();

const { data: completions } = await supabase
  .from('completions')
  .select('photo_url');

const referencedPaths = completions.map(c =>
  extractPathFromUrl(c.photo_url)
);

const orphanedFiles = files.filter(f =>
  !referencedPaths.includes(f.name)
);

// Delete orphaned files
```

#### EDGE-STORAGE-004: Image Load Failure in Gallery
**Scenario**: Photo URL is valid but image fails to load (deleted, corrupt, etc.).

**Expected Behavior**:
- Show placeholder image (camera icon)
- Log error for admin review
- Don't crash page

**Implementation**:
```typescript
<Image
  src={photoUrl}
  alt={`${name}'s run`}
  onError={(e) => {
    e.currentTarget.src = '/images/placeholder.jpg';
    logError({ completionId, photoUrl, error: 'Image load failed' });
  }}
/>
```

### 6.6 Concurrent User Edge Cases (EDGE-CONCUR)

#### EDGE-CONCUR-001: Last-Minute Voting Rush
**Scenario**: 100 users vote in the last 5 minutes before deadline.

**Potential Issues**:
- Database connection pool exhaustion
- Slow query performance
- Rate limiting kicks in

**Mitigation**:
- Use Supabase connection pooling (pgBouncer)
- Optimize vote insert query (prepared statement)
- Set generous rate limits for voting (10 req/min per user)
- Load test before launch

**Load Test**:
```bash
# Using k6 or similar
100 users voting concurrently
Expected: All votes succeed within 5 seconds
```

#### EDGE-CONCUR-002: Multiple Simultaneous Registrations
**Scenario**: 50 people register at event kickoff.

**Potential Issues**:
- Bib number collisions (if sequence not used)
- Email sending queue overflow
- Slow response times

**Mitigation**:
- Use database sequence for bib numbers (atomic)
- Queue emails (don't block registration)
- Serverless scales automatically (Vercel)

### 6.7 Data Integrity Edge Cases (EDGE-DATA)

#### EDGE-DATA-001: Participant Deletion
**Scenario**: Admin needs to delete a participant (GDPR request).

**Cascading Effects**:
- Completion record deleted (CASCADE)
- Votes cast by participant deleted (CASCADE)
- Votes on participant's completion deleted (CASCADE)
- Photo in storage orphaned

**Procedure**:
```sql
-- 1. Get photo URL before deletion
SELECT photo_url FROM completions WHERE participant_id = ?;

-- 2. Delete participant (cascades to completions and votes)
DELETE FROM participants WHERE id = ?;

-- 3. Manually delete photo from storage
-- (Supabase doesn't cascade deletes to storage)
```

**Better Solution**: Soft delete
```sql
ALTER TABLE participants ADD COLUMN deleted_at TIMESTAMPTZ;

-- Filter out deleted in queries
WHERE deleted_at IS NULL;

-- For GDPR: Anonymize instead of delete
UPDATE participants
SET name = 'Deleted User',
    email = 'deleted_' || id || '@example.com',
    address = 'REDACTED',
    phone = NULL,
    deleted_at = now()
WHERE id = ?;
```

#### EDGE-DATA-002: User ID Mismatch
**Scenario**: Participant record exists but user_id is NULL or wrong.

**This happens if**:
- User registered before email verification flow added
- Manual data migration error

**Detection**:
```sql
SELECT * FROM participants WHERE user_id IS NULL;
```

**Fix**:
- User logs in with magic link → user_id assigned
- Or admin manually links participant to auth user

---

## 7. API Specifications

### 7.1 Registration API

#### POST /api/register

**Description**: Register a new participant.

**Authentication**: None (public endpoint)

**Request Body**:
```json
{
  "name": "Ola Nordmann",
  "email": "ola@example.com",
  "address": "Storgata 1, 4000 Stavanger",
  "phone": "+4712345678"
}
```

**Validation**:
- name: string, 2-100 chars, alphabetic + space/hyphen/period
- email: valid email, max 255 chars, unique
- address: string, 10-200 chars
- phone: optional, Norwegian format (+47XXXXXXXX)

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "a7b3c4d5-e6f7-8901-2345-67890abcdef1",
    "name": "Ola Nordmann",
    "email": "ola@example.com",
    "bib_number": 1001
  }
}
```

**Error Responses**:

**400 Bad Request** (Validation failure):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "fields": {
      "email": "Ugyldig e-postadresse",
      "name": "Navn må være minst 2 tegn"
    }
  }
}
```

**409 Conflict** (Duplicate email):
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "E-postadressen er allerede registrert",
    "action": "login"
  }
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "En feil oppstod. Prøv igjen senere."
  }
}
```

**Side Effects**:
- Participant record created in database
- Bib number generated (auto-increment from 1001)
- Confirmation email queued for sending
- Log entry created

**Rate Limiting**: 5 requests per minute per IP

---

### 7.2 Authentication API

Authentication handled by Supabase Auth. No custom API routes needed.

#### POST /auth/v1/magiclink (Supabase)

**Request**:
```json
{
  "email": "ola@example.com"
}
```

**Response**: 200 OK (always, for security)

---

### 7.3 Completion API

#### POST /api/completions

**Description**: Submit run completion with photo.

**Authentication**: Required (Bearer token)

**Request**: Multipart form data
```
completion_date: "2024-11-15"
time_duration: "52:30"
photo: [File]
comment: "Fantastisk løp!"
```

**Validation**:
- completion_date: date, in November, not future
- time_duration: optional, string, max 50 chars
- photo: required, image file, max 5MB, types: jpg/png/webp
- comment: optional, string, max 500 chars

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "b8c4d5e6-f7a8-9012-3456-7890abcdef12",
    "participant_id": "a7b3c4d5-e6f7-8901-2345-67890abcdef1",
    "completion_date": "2024-11-15",
    "time_duration": "52:30",
    "photo_url": "https://[project].supabase.co/storage/v1/object/public/completion-photos/...",
    "comment": "Fantastisk løp!",
    "vote_count": 0,
    "created_at": "2024-11-15T18:30:00Z"
  }
}
```

**Error Responses**:

**401 Unauthorized**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Du må være innlogget"
  }
}
```

**400 Bad Request** (Validation):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Ugyldig data",
    "fields": {
      "photo": "Bildet må være under 5MB",
      "completion_date": "Dato må være i november"
    }
  }
}
```

**409 Conflict** (Already submitted):
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_COMPLETION",
    "message": "Du har allerede sendt inn ditt løp"
  }
}
```

**413 Payload Too Large**:
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Bildet må være under 5MB"
  }
}
```

**Side Effects**:
- Photo uploaded to Supabase Storage
- Completion record created in database
- Photo appears in gallery immediately

**Rate Limiting**: 3 requests per minute per user

---

#### PATCH /api/completions/:id

**Description**: Edit existing completion.

**Authentication**: Required (must be owner)

**Request**: Multipart form data (all fields optional)
```
completion_date: "2024-11-16"
time_duration: "50:00"
photo: [File] (optional, replaces existing)
comment: "Updated comment"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "b8c4d5e6-f7a8-9012-3456-7890abcdef12",
    "completion_date": "2024-11-16",
    "time_duration": "50:00",
    "photo_url": "https://...",
    "comment": "Updated comment",
    "vote_count": 0
  }
}
```

**Error Responses**:

**403 Forbidden** (Has votes):
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_EDIT_WITH_VOTES",
    "message": "Kan ikke redigere etter at andre har stemt"
  }
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Fullføring ikke funnet"
  }
}
```

**Side Effects**:
- Completion record updated
- Old photo deleted if new photo uploaded

---

#### GET /api/completions

**Description**: Get all completions for gallery.

**Authentication**: Optional (public data)

**Query Parameters**:
- sort: "recent" | "votes" (default: "recent")
- limit: number (default: 20, max: 100)
- offset: number (default: 0)

**Request**: GET /api/completions?sort=votes&limit=20&offset=0

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "b8c4d5e6-f7a8-9012-3456-7890abcdef12",
      "participant": {
        "id": "a7b3c4d5-e6f7-8901-2345-67890abcdef1",
        "name": "Ola Nordmann",
        "bib_number": 1001
      },
      "completion_date": "2024-11-15",
      "time_duration": "52:30",
      "photo_url": "https://...",
      "comment": "Fantastisk løp!",
      "vote_count": 5,
      "created_at": "2024-11-15T18:30:00Z"
    },
    // ... more completions
  ],
  "pagination": {
    "total": 127,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

**Sorting**:
- recent: ORDER BY created_at DESC
- votes: ORDER BY vote_count DESC, created_at DESC

---

### 7.4 Voting API

#### POST /api/votes

**Description**: Vote for a completion photo.

**Authentication**: Required

**Request Body**:
```json
{
  "completion_id": "b8c4d5e6-f7a8-9012-3456-7890abcdef12"
}
```

**Validation**:
- completion_id: valid UUID, exists
- User is authenticated
- User is registered participant
- User hasn't voted yet
- Completion is not user's own

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "c9d5e6f7-a8b9-0123-4567-890abcdef123",
    "voter_id": "a7b3c4d5-e6f7-8901-2345-67890abcdef1",
    "completion_id": "b8c4d5e6-f7a8-9012-3456-7890abcdef12",
    "created_at": "2024-11-20T15:30:00Z"
  }
}
```

**Error Responses**:

**401 Unauthorized**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Du må være innlogget for å stemme"
  }
}
```

**403 Forbidden** (Own photo):
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_VOTE_OWN_PHOTO",
    "message": "Du kan ikke stemme på ditt eget bilde"
  }
}
```

**409 Conflict** (Already voted):
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_VOTED",
    "message": "Du har allerede stemt"
  }
}
```

**Side Effects**:
- Vote record created
- vote_count incremented on completion (via trigger)

**Rate Limiting**: 10 requests per minute per user (allows retries)

---

#### GET /api/votes/my-vote

**Description**: Check if current user has voted, and for which completion.

**Authentication**: Required

**Success Response** (200 OK):

If voted:
```json
{
  "success": true,
  "data": {
    "has_voted": true,
    "completion_id": "b8c4d5e6-f7a8-9012-3456-7890abcdef12",
    "voted_at": "2024-11-20T15:30:00Z"
  }
}
```

If not voted:
```json
{
  "success": true,
  "data": {
    "has_voted": false
  }
}
```

---

### 7.5 Participant API

#### GET /api/participants

**Description**: Get list of all participants (for participants list page).

**Authentication**: Optional

**Query Parameters**:
- search: string (search by name)
- sort: "name" | "bib" | "completed" (default: "bib")
- limit: number (default: 50, max: 500)
- offset: number (default: 0)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "a7b3c4d5-e6f7-8901-2345-67890abcdef1",
      "name": "Ola Nordmann",
      "bib_number": 1001,
      "has_completed": true,
      "completion_date": "2024-11-15"
    },
    // ... more participants
  ],
  "pagination": {
    "total": 234,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

### 7.6 Dashboard API

#### GET /api/dashboard

**Description**: Get current user's dashboard data.

**Authentication**: Required

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "participant": {
      "id": "a7b3c4d5-e6f7-8901-2345-67890abcdef1",
      "name": "Ola Nordmann",
      "email": "ola@example.com",
      "bib_number": 1001
    },
    "completion": {
      "id": "b8c4d5e6-f7a8-9012-3456-7890abcdef12",
      "completion_date": "2024-11-15",
      "time_duration": "52:30",
      "photo_url": "https://...",
      "comment": "Fantastisk løp!",
      "vote_count": 5
    } | null,
    "vote": {
      "completion_id": "c9d5e6f7-a8b9-0123-4567-890abcdef123",
      "voted_at": "2024-11-20T15:30:00Z"
    } | null,
    "stats": {
      "total_participants": 234,
      "total_completions": 187,
      "completion_rank": 42
    }
  }
}
```

---

## 8. Validation Rules

### 8.1 Client-Side Validation (React Hook Form + Zod)

All forms use Zod schemas for validation. Errors shown in Norwegian.

**Benefits**:
- Immediate feedback
- Reduce server load
- Better UX

**Implementation**:
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(participantSchema),
  mode: 'onBlur' // Validate on blur
});
```

### 8.2 Server-Side Validation

**Rule**: Always re-validate on server, never trust client.

**Implementation**:
```typescript
export async function POST(request: Request) {
  const body = await request.json();

  // Parse with Zod (throws if invalid)
  const validated = participantSchema.parse(body);

  // Additional server-only validation
  const emailExists = await checkEmailExists(validated.email);
  if (emailExists) {
    return Response.json(
      { error: 'Email already registered' },
      { status: 409 }
    );
  }

  // Proceed with validated data
}
```

### 8.3 Database-Level Validation

**Rule**: Constraints are the last line of defense.

**Implementation**:
- CHECK constraints for value ranges
- UNIQUE constraints for uniqueness
- NOT NULL for required fields
- FOREIGN KEY for referential integrity

---

## 9. Error Handling Requirements

### 9.1 Error Categories

#### 1. Client Errors (4xx)
- **400 Bad Request**: Invalid input
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Authenticated but not authorized
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Duplicate/conflict
- **413 Payload Too Large**: File too big
- **429 Too Many Requests**: Rate limited

#### 2. Server Errors (5xx)
- **500 Internal Server Error**: Unexpected error
- **503 Service Unavailable**: Supabase down, maintenance

### 9.2 Error Response Format

**Standard Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message in Norwegian",
    "details": {} // Optional, for debugging
  }
}
```

### 9.3 Error Logging

**Requirements**:
- Log all 500 errors
- Log all validation errors (for improvement)
- Include request ID for tracing
- Include user ID if authenticated
- Don't log sensitive data (passwords, tokens)

**Implementation**: Use Vercel's built-in logging or Sentry.

### 9.4 User-Facing Error Messages

**Guidelines**:
- In Norwegian
- Clear and actionable
- No technical jargon
- Suggest next steps

**Examples**:

| Error | Message |
|-------|---------|
| Network failure | "Kunne ikke koble til. Sjekk internettforbindelsen din." |
| Email taken | "E-postadressen er allerede registrert. [Logg inn]" |
| File too large | "Bildet er for stort (7.2 MB). Maksimal størrelse er 5 MB." |
| Already voted | "Du har allerede stemt. Stemmer kan ikke endres." |
| Server error | "En feil oppstot. Vi jobber med å fikse det. Prøv igjen om litt." |

---

## 10. Test Scenarios

### 10.1 Registration Flow Tests

#### TEST-REG-001: Successful Registration
**Given**: New user with valid data
**When**: User submits registration form
**Then**:
- Participant created in database
- Unique bib number assigned (e.g., 1001)
- Confirmation email sent
- User redirected to confirmation page
- Bib number displayed

#### TEST-REG-002: Duplicate Email
**Given**: Email "test@example.com" already registered
**When**: User registers with same email
**Then**:
- Registration fails with 409 error
- Error message shown: "E-postadressen er allerede registrert"
- Login link provided

#### TEST-REG-003: Invalid Email Format
**Given**: User enters "notanemail"
**When**: User submits form
**Then**:
- Client validation catches error
- Error shown: "Ugyldig e-postadresse"
- Form not submitted

#### TEST-REG-004: Name Too Short
**Given**: User enters name "A"
**When**: User submits form
**Then**:
- Client validation catches error
- Error shown: "Navn må være minst 2 tegn"

#### TEST-REG-005: Concurrent Bib Number Generation
**Given**: Two users submit registration simultaneously
**When**: Both requests hit server at same time
**Then**:
- User 1 gets bib number 1001
- User 2 gets bib number 1002
- No duplicate bib numbers (sequence handles atomicity)

### 10.2 Authentication Flow Tests

#### TEST-AUTH-001: Successful Magic Link Login
**Given**: Registered user with email "test@example.com"
**When**: User requests magic link and clicks it
**Then**:
- Magic link email received
- Link authenticates user
- Redirected to dashboard
- Session created (7 day expiry)

#### TEST-AUTH-002: Expired Magic Link
**Given**: Magic link sent 2 hours ago
**When**: User clicks expired link
**Then**:
- Error shown: "Lenken har utløpt"
- Option to request new link

#### TEST-AUTH-003: Unregistered Email
**Given**: Email "notregistered@example.com" not in database
**When**: User requests magic link
**Then**:
- Error shown: "E-postadressen er ikke registrert"
- Link to registration page

### 10.3 Completion Submission Tests

#### TEST-COMP-001: Successful Completion
**Given**: Authenticated user without existing completion
**When**: User submits completion with valid data and 3MB photo
**Then**:
- Photo uploaded to Supabase Storage
- Completion record created
- Photo URL stored
- Success confirmation shown
- Completion appears in gallery

#### TEST-COMP-002: Photo Too Large
**Given**: User selects 7MB photo
**When**: User tries to submit
**Then**:
- Client validation rejects
- Error: "Bildet må være under 5MB"
- Form not submitted

#### TEST-COMP-003: Invalid File Type
**Given**: User selects PDF file
**When**: User tries to attach file
**Then**:
- Client validation rejects
- Error: "Kun bildefiler er tillatt"
- File input cleared

#### TEST-COMP-004: Future Date
**Given**: User selects tomorrow's date
**When**: User tries to submit
**Then**:
- Client disables future dates
- If bypassed, server rejects with error

#### TEST-COMP-005: Duplicate Submission
**Given**: User already has completion
**When**: User tries to submit again via API
**Then**:
- Database constraint prevents duplicate
- Error: "Du har allerede sendt inn"

#### TEST-COMP-006: Edit Without Votes
**Given**: User has completion with 0 votes
**When**: User edits completion
**Then**:
- Edit allowed
- Completion updated
- If photo changed, old photo deleted

#### TEST-COMP-007: Edit With Votes
**Given**: User has completion with 3 votes
**When**: User tries to edit
**Then**:
- Edit rejected
- Error: "Kan ikke redigere etter at andre har stemt"

### 10.4 Voting Flow Tests

#### TEST-VOTE-001: Successful Vote
**Given**: Authenticated user who hasn't voted
**When**: User clicks heart on another user's photo
**Then**:
- Vote recorded in database
- vote_count incremented
- Heart fills in UI
- All other hearts disabled
- Toast: "Stemme registrert!"

#### TEST-VOTE-002: Vote for Own Photo
**Given**: User viewing their own completion
**When**: User tries to click heart (UI prevents)
**Then**:
- Heart disabled (greyed out)
- Tooltip: "Du kan ikke stemme på ditt eget bilde"

#### TEST-VOTE-003: Double Voting (UI)
**Given**: User already voted
**When**: User views gallery
**Then**:
- Voted photo shows filled heart
- All other photos show greyed heart
- Tooltip: "Du har allerede stemt"

#### TEST-VOTE-004: Double Voting (API Attack)
**Given**: User already voted
**When**: User sends duplicate vote via API
**Then**:
- Database constraint prevents duplicate
- API returns 409 Conflict
- No vote count change

#### TEST-VOTE-005: Vote Without Login
**Given**: Unauthenticated user
**When**: User clicks heart
**Then**:
- Modal shown: "Logg inn for å stemme"
- Login button provided

### 10.5 Gallery Display Tests

#### TEST-GALLERY-001: Load Gallery
**Given**: Database has 100 completions
**When**: User navigates to /galleri
**Then**:
- First 20 completions load
- Displayed in grid (responsive)
- Each card shows: photo, name, bib, date, comment, vote count

#### TEST-GALLERY-002: Sort by Votes
**Given**: Gallery loaded with "Nyeste" sort
**When**: User selects "Mest stemmer"
**Then**:
- Gallery re-fetches sorted by vote_count DESC
- Cards re-render in new order

#### TEST-GALLERY-003: Lazy Load Images
**Given**: User scrolls down gallery
**When**: Images come into viewport
**Then**:
- Images load as they become visible
- Placeholder shown while loading
- Smooth scrolling experience

#### TEST-GALLERY-004: Image Load Failure
**Given**: Photo URL is broken
**When**: Gallery tries to load image
**Then**:
- Placeholder image shown
- No error crash
- Error logged

### 10.6 Performance Tests

#### TEST-PERF-001: Page Load Time
**Given**: User on 3G mobile connection
**When**: User navigates to homepage
**Then**:
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Time to Interactive < 3.5s

#### TEST-PERF-002: Gallery Load Time
**Given**: 200 completions in database
**When**: User loads /galleri
**Then**:
- Initial 20 photos load < 2s
- Lazy load next photos < 1s each batch

#### TEST-PERF-003: Concurrent Users
**Given**: 100 users accessing site simultaneously
**When**: All performing various actions
**Then**:
- No degradation in response times
- All requests succeed
- No database connection errors

### 10.7 Security Tests

#### TEST-SEC-001: RLS Policy - View Own Data Only
**Given**: User A authenticated
**When**: User A queries dashboard API
**Then**:
- Only User A's data returned
- Cannot see User B's data

#### TEST-SEC-002: RLS Policy - No Self Voting
**Given**: User tries to insert vote for own photo
**When**: Direct database insert attempted
**Then**:
- Database check constraint rejects
- Error: violates check constraint "votes_no_self_vote"

#### TEST-SEC-003: SQL Injection Attempt
**Given**: Attacker enters SQL in form field
**When**: Form submitted with `'; DROP TABLE participants; --`
**Then**:
- Parameterized query prevents injection
- Input treated as string, not SQL
- No damage to database

#### TEST-SEC-004: XSS Attempt
**Given**: User enters `<script>alert('XSS')</script>` in comment
**When**: Comment displayed in gallery
**Then**:
- HTML sanitized (React escapes by default)
- Script not executed
- Displayed as plain text

#### TEST-SEC-005: File Upload - Executable Disguised as Image
**Given**: Attacker uploads `malware.exe` renamed to `malware.jpg`
**When**: Server receives file
**Then**:
- Magic byte validation detects not a real image
- Upload rejected: "Ugyldig bildefil"

### 10.8 Edge Case Tests

#### TEST-EDGE-001: Storage Quota Reached
**Given**: Supabase storage at 1GB limit
**When**: User tries to upload photo
**Then**:
- Upload fails with 507 error
- User-friendly message shown
- Admin notified

#### TEST-EDGE-002: Email Delivery Failure
**Given**: Email service down
**When**: User registers
**Then**:
- Registration succeeds
- Bib number shown on page
- Error logged for admin
- "Resend email" button available

#### TEST-EDGE-003: Session Expiry During Form Fill
**Given**: User filling completion form, session expires
**When**: User submits form
**Then**:
- API returns 401
- Modal: "Din økt har utløpt. Logg inn igjen."
- Form data saved to localStorage
- After re-auth, form data restored

---

## 11. Security Requirements

### 11.1 Authentication Security (SEC-AUTH)

#### SEC-AUTH-001: Passwordless Authentication
- Use Supabase Auth magic links only
- No password storage or management
- Reduces risk of password breaches

#### SEC-AUTH-002: Token Security
- JWT tokens signed by Supabase
- Tokens include expiration (1 hour default)
- Refresh tokens rotated on use
- Tokens transmitted over HTTPS only

#### SEC-AUTH-003: Session Management
- Session cookies: httpOnly, secure, sameSite=lax
- Session duration: 7 days (configurable)
- Automatic session refresh before expiry
- Logout clears all session data

#### SEC-AUTH-004: Rate Limiting
- Magic link requests: 3 per hour per email
- Login attempts: 10 per hour per IP
- API endpoints: Varies by endpoint (documented above)

### 11.2 Data Security (SEC-DATA)

#### SEC-DATA-001: Encryption in Transit
- HTTPS enforced on all pages
- TLS 1.3 for database connections
- No mixed content (all resources over HTTPS)

#### SEC-DATA-002: Encryption at Rest
- Supabase encrypts database at rest (AES-256)
- File storage encrypted at rest
- No application-level encryption needed

#### SEC-DATA-003: Row Level Security (RLS)
- RLS enabled on all tables
- Policies enforce data access rules
- Users can only access their own data (except public views)

#### SEC-DATA-004: Input Sanitization
- All user inputs validated with Zod
- HTML in comments escaped (React default)
- SQL injection prevented (parameterized queries)
- File uploads validated by type and size

### 11.3 Authorization Security (SEC-AUTHZ)

#### SEC-AUTHZ-001: Route Protection
- Protected routes check authentication
- Unauthenticated users redirected to login
- Authorization checked on both client and server

#### SEC-AUTHZ-002: Resource Ownership
- Users can only edit their own completions
- Users can only vote once
- Admin actions require admin role (future)

#### SEC-AUTHZ-003: API Endpoint Authorization
- All write operations require authentication
- Read operations public (for gallery) or private (dashboard)
- Authorization checked via RLS policies

### 11.4 File Upload Security (SEC-FILE)

#### SEC-FILE-001: File Type Validation
- Whitelist: JPG, PNG, WEBP, HEIC only
- Magic byte verification (not just extension)
- Reject executables, scripts, documents

#### SEC-FILE-002: File Size Limits
- Client-side: 5MB max
- Server-side: 5MB max (re-validate)
- Supabase Storage: 5MB limit configured

#### SEC-FILE-003: File Storage Isolation
- Photos stored in dedicated Supabase bucket
- Public read access only
- Upload requires authentication
- Files served via Supabase CDN (not application server)

#### SEC-FILE-004: Malware Prevention
- No executable files allowed
- Consider virus scanning (if available in Supabase tier)
- Monitor for suspicious uploads

### 11.5 GDPR & Privacy (SEC-PRIVACY)

#### SEC-PRIVACY-001: Data Minimization
- Collect only necessary data
- Phone number optional
- No tracking beyond analytics

#### SEC-PRIVACY-002: Right to Access
- Users can view all their data via dashboard
- Provide data export if requested

#### SEC-PRIVACY-003: Right to Deletion
- Users can request account deletion
- Implement soft delete (anonymize)
- Delete photos from storage

#### SEC-PRIVACY-004: Privacy Policy
- Clear privacy policy on website
- Explain what data is collected and why
- Explain how data is used (event management, medal delivery)

#### SEC-PRIVACY-005: Cookie Consent
- Essential cookies only (session)
- Analytics optional with consent banner
- Respect user preferences

### 11.6 Application Security (SEC-APP)

#### SEC-APP-001: CSRF Protection
- Next.js built-in CSRF protection
- SameSite cookies
- CSRF tokens on state-changing operations

#### SEC-APP-002: XSS Prevention
- React escapes output by default
- No dangerouslySetInnerHTML unless sanitized
- Content Security Policy headers

#### SEC-APP-003: Dependency Security
- Regular npm audit
- Update dependencies monthly
- Use Dependabot for automated PRs

#### SEC-APP-004: Environment Variables
- Never commit secrets to Git
- Use Vercel environment variables
- Service role key only on server-side
- Anon key safe for client (RLS enforces security)

#### SEC-APP-005: Error Handling
- Don't expose stack traces to users
- Log errors server-side only
- Generic error messages to users

### 11.7 Infrastructure Security (SEC-INFRA)

#### SEC-INFRA-001: Vercel Security
- Automatic HTTPS
- DDoS protection
- Edge network caching

#### SEC-INFRA-002: Supabase Security
- Database isolated per project
- Connection pooling with pgBouncer
- Automatic backups
- Point-in-time recovery

#### SEC-INFRA-003: Monitoring & Alerts
- Monitor for suspicious activity
- Alert on repeated failed logins
- Alert on storage quota approaching limit
- Alert on unusual traffic patterns

---

## 12. Conclusion & Recommendations

### 12.1 Critical Path Features

**Must-Have for Launch**:
1. Registration with bib number generation
2. Magic link authentication
3. Completion submission with photo upload
4. Photo gallery with voting
5. Dashboard for users

**Nice-to-Have (Phase 2)**:
6. Participants list page
7. Downloadable bib PDF
8. Social media sharing
9. Interactive map
10. Progress bars/stats

### 12.2 Technical Debt Prevention

**Recommendations**:
- Write tests for critical flows before launch
- Document all environment variables
- Keep dependencies updated
- Monitor performance metrics from day 1
- Set up error tracking (Sentry)

### 12.3 Launch Checklist

**Pre-Launch**:
- [ ] All database tables created with RLS
- [ ] Storage bucket configured
- [ ] Email templates in Norwegian
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate verified
- [ ] Test all user flows manually
- [ ] Load test with 100 concurrent users
- [ ] Backup strategy confirmed
- [ ] Privacy policy published
- [ ] Contact information on website

**Post-Launch**:
- [ ] Monitor error logs daily (first week)
- [ ] Check storage usage weekly
- [ ] Review vote counts for anomalies
- [ ] Gather user feedback
- [ ] Fix critical bugs within 24 hours
- [ ] Plan phase 2 features

### 12.4 Success Metrics

**Track These Metrics**:
- Registration conversion rate (visitors → registered)
- Completion rate (registered → completed)
- Voting participation (completed → voted)
- Average photo upload time
- Page load times (P95)
- Error rate (aim for < 0.1%)

### 12.5 Risk Mitigation

**Potential Risks & Mitigation**:

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Storage quota exceeded | Medium | High | Monitor usage, compress images, upgrade plan |
| Vote manipulation | Medium | High | RLS policies, rate limiting, audit logs |
| Email delivery failure | Low | Medium | Retry logic, show bib on page anyway |
| Database connection limits | Low | High | Connection pooling (built-in), monitor usage |
| Slow photo uploads on mobile | High | Medium | Progress indicator, allow cancellation, optimize images |
| GDPR violation | Low | Critical | Clear privacy policy, implement deletion flow |

---

## Appendix A: Text-Based User Flow Diagrams

### Registration Flow

```
┌─────────────┐
│  Homepage   │
└──────┬──────┘
       │ Click "Meld deg på"
       ▼
┌─────────────────────┐
│ Registration Form   │
│ ┌─────────────────┐ │
│ │ Name            │ │
│ │ Email           │ │
│ │ Address         │ │
│ │ Phone (opt)     │ │
│ └─────────────────┘ │
└──────┬──────────────┘
       │ Submit
       ▼
┌─────────────────────┐     ┌───────────────┐
│ Client Validation   ├─No─►│ Show Errors   │
└──────┬──────────────┘     └───────────────┘
       │ Yes
       ▼
┌─────────────────────┐     ┌───────────────┐
│ Server Validation   ├─No─►│ Show Error    │
└──────┬──────────────┘     │ (e.g. dup)    │
       │ Yes                 └───────────────┘
       ▼
┌─────────────────────┐
│ Create Participant  │
│ Generate Bib Number │
└──────┬──────────────┘
       │
       ├────────────────────┐
       │                    │
       ▼                    ▼
┌─────────────┐      ┌──────────────┐
│ Send Email  │      │ Redirect to  │
│             │      │ Confirmation │
└─────────────┘      └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ Show Bib #   │
                     │ Next Steps   │
                     └──────────────┘
```

### Authentication Flow

```
┌─────────────┐
│ Dashboard   │
│ (Protected) │
└──────┬──────┘
       │ Not authenticated
       ▼
┌─────────────────────┐
│   Login Page        │
│ ┌─────────────────┐ │
│ │ Email Address   │ │
│ └─────────────────┘ │
└──────┬──────────────┘
       │ Submit
       ▼
┌─────────────────────┐     ┌───────────────┐
│ Email Registered?   ├─No─►│ Show Error    │
└──────┬──────────────┘     │ + Reg Link    │
       │ Yes                 └───────────────┘
       ▼
┌─────────────────────┐
│ Send Magic Link     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ "Check your email"  │
└─────────────────────┘

       [User opens email]

┌─────────────────────┐
│ Click Magic Link    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌───────────────┐
│ Token Valid?        ├─No─►│ Expired/Used  │
└──────┬──────────────┘     │ Error         │
       │ Yes                 └───────────────┘
       ▼
┌─────────────────────┐
│ Create Session      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Redirect to         │
│ Dashboard           │
└─────────────────────┘
```

### Completion Submission Flow

```
┌─────────────────────┐
│ Dashboard           │
│ (Authenticated)     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌───────────────────┐
│ Has Completion?     ├─Yes─►│ Show Existing     │
└──────┬──────────────┘     │ + Edit Button     │
       │ No                  └───────────────────┘
       ▼
┌─────────────────────┐
│ Completion Form     │
│ ┌─────────────────┐ │
│ │ Date            │ │
│ │ Time            │ │
│ │ Photo (file)    │ │
│ │ Comment         │ │
│ └─────────────────┘ │
└──────┬──────────────┘
       │ Submit
       ▼
┌─────────────────────┐     ┌───────────────┐
│ Client Validation   ├─No─►│ Show Errors   │
└──────┬──────────────┘     └───────────────┘
       │ Yes
       ▼
┌─────────────────────┐
│ Upload Photo        │
│ (Progress Bar)      │
└──────┬──────────────┘
       │ Success
       ▼
┌─────────────────────┐     ┌───────────────┐
│ Server Validation   ├─No─►│ Delete Photo  │
└──────┬──────────────┘     │ Show Error    │
       │ Yes                 └───────────────┘
       ▼
┌─────────────────────┐
│ Create Completion   │
│ Record in DB        │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Success             │
│ Show Preview        │
│ "Se i galleriet" →  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Gallery Page        │
│ (Photo visible)     │
└─────────────────────┘
```

### Voting Flow

```
┌─────────────────────┐
│ Gallery Page        │
│ (Grid of Photos)    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌───────────────┐
│ User Logged In?     ├─No─►│ "Logg inn for │
└──────┬──────────────┘     │ å stemme"     │
       │ Yes                 └───────────────┘
       ▼
┌─────────────────────┐     ┌───────────────┐
│ Already Voted?      ├─Yes─►│ Show Filled   │
└──────┬──────────────┘     │ Heart, Disable│
       │ No                  └───────────────┘
       ▼
┌─────────────────────┐
│ Click Heart on      │
│ Another's Photo     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌───────────────┐
│ Own Photo?          ├─Yes─►│ Disabled      │
└──────┬──────────────┘     └───────────────┘
       │ No
       ▼
┌─────────────────────┐
│ Optimistic UI:      │
│ Fill Heart          │
│ Increment Count     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐     ┌───────────────────┐
│ Server Validation   ├─No─►│ Revert UI         │
└──────┬──────────────┘     │ Show Error        │
       │ Yes                 └───────────────────┘
       ▼
┌─────────────────────┐
│ Insert Vote Record  │
│ Increment Count     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Success Toast       │
│ Disable All Hearts  │
└─────────────────────┘
```

---

## Appendix B: Database Diagram (Text Format)

```
┌──────────────────────┐
│   auth.users         │ (Supabase Auth)
│──────────────────────│
│ id (uuid) PK         │
│ email                │
│ ...                  │
└──────────┬───────────┘
           │ 1:1
           │
┌──────────▼───────────┐
│   participants       │
│──────────────────────│
│ id (uuid) PK         │
│ created_at           │
│ name                 │◄─────────┐
│ email (unique)       │          │
│ address              │          │ 1:1
│ phone (nullable)     │          │
│ bib_number (unique)  │          │
│ user_id (FK) ────────┘          │
└──────────┬───────────┘          │
           │ 1:1                  │
           │                      │
┌──────────▼───────────┐          │
│   completions        │          │
│──────────────────────│          │
│ id (uuid) PK         │          │
│ created_at           │          │
│ participant_id (FK) ─┘          │
│ completion_date      │          │
│ time_duration        │          │ Many:1
│ photo_url            │          │ (voter)
│ comment              │◄─────────┤
│ vote_count           │          │
└──────────┬───────────┘          │
           │ 1:Many                │
           │                      │
┌──────────▼───────────┐          │
│   votes              │          │
│──────────────────────│          │
│ id (uuid) PK         │          │
│ created_at           │          │
│ voter_id (FK) ───────────────────┘
│ completion_id (FK) ──┘
│ UNIQUE(voter_id, completion_id)
└──────────────────────┘

Storage Bucket:
┌──────────────────────┐
│ completion-photos    │
│──────────────────────│
│ Files: {id}/{ts}.jpg │
│ Public: true         │
│ Max: 5MB             │
└──────────────────────┘
```

---

## Document Control

**Version**: 1.0
**Last Updated**: 2025-10-28
**Author**: ANALYST Agent (Hive Mind)
**Status**: Complete
**Next Review**: After ARCHITECT review

**Change Log**:
- 2025-10-28: Initial comprehensive analysis created

**Related Documents**:
- Technical Architecture Specification (to be created by ARCHITECT)
- Implementation Plan (to be created by CODER)
- Test Plan (to be created by TESTER)
- Deployment Guide (to be created by DOCUMENTER)

---

**END OF REQUIREMENTS ANALYSIS**
