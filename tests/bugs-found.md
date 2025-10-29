# Bug List - Multi-Year Event Implementation

**Date:** 2025-10-29
**QA Engineer:** QA_ENGINEER Agent
**Status:** Pre-Implementation Bug Analysis

---

## Critical Bugs (P0) - System Breaking

### BUG-001: Database Types Missing event_year Field
**Severity:** CRITICAL
**Status:** Open
**Component:** Type Definitions
**File:** `/home/stian/Repos/barteløpet/lib/types/database.ts`

**Description:**
TypeScript type definitions do not include the `event_year` field that exists in the database schema after migration. This causes type mismatches and will break the application.

**Impact:**
- TypeScript compilation errors
- Type safety broken
- Cannot access event_year in queries
- Insert/Update operations will fail

**Affected Types:**
- `Participant` interface (missing event_year)
- `Completion` interface (missing event_year)
- `Vote` interface (missing event_year)
- `PhotoComment` interface (missing event_year)
- All Insert/Update type derivatives

**Expected:**
```typescript
export interface Participant {
  id: string
  user_id: string | null
  email: string
  full_name: string
  postal_address: string
  phone_number: string | null
  bib_number: number
  has_completed: boolean
  event_year: number  // <- MISSING
  created_at: string
  updated_at: string
}
```

**Actual:**
```typescript
export interface Participant {
  // ... all fields exist EXCEPT event_year
}
```

**Fix Required:**
Add `event_year: number` to all affected interfaces.

**Estimated Fix Time:** 30 minutes

---

### BUG-002: YearProvider Not Included in Root Layout
**Severity:** CRITICAL
**Status:** Open
**Component:** Layout Provider
**File:** `/home/stian/Repos/barteløpet/app/layout.tsx`

**Description:**
The `YearProvider` context component exists but is not wrapped around the application in the root layout. This means no components can use year context.

**Impact:**
- `useYear()` hook will throw error "must be used within YearProvider"
- Year selection feature completely non-functional
- Multi-year system cannot work

**Current Code:**
```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="nb-NO">
      <body className={inter.className}>
        <Navigation />
        <main>{children}</main>  {/* No YearProvider! */}
        <footer>...</footer>
      </body>
    </html>
  );
}
```

**Expected Code:**
```typescript
import { YearProvider } from '@/contexts/year-context';

export default function RootLayout({ children }) {
  return (
    <html lang="nb-NO">
      <body className={inter.className}>
        <YearProvider>
          <Navigation />
          <main>{children}</main>
          <footer>...</footer>
        </YearProvider>
      </body>
    </html>
  );
}
```

**Fix Required:**
Import and wrap components with YearProvider.

**Estimated Fix Time:** 5 minutes

---

### BUG-003: Gallery Queries Not Year-Filtered
**Severity:** CRITICAL
**Status:** Open
**Component:** Data Fetching
**File:** `/home/stian/Repos/barteløpet/app/galleri/page.tsx`

**Description:**
The gallery page fetches ALL completions from ALL years instead of filtering by selected year. This violates data isolation requirements.

**Impact:**
- Shows data from all years mixed together
- Wrong vote counts (votes from different years)
- Cannot view year-specific galleries
- Breaks core multi-year functionality

**Current Code:**
```typescript
async function getCompletions() {
  const { data: completions } = await supabase
    .from('completions')
    .select('*')
    .order('created_at', { ascending: false });
  // NO .eq('event_year', year) filter!
}
```

**Expected Code:**
```typescript
async function getCompletions(year: number) {
  const { data: completions } = await supabase
    .from('completions')
    .select('*')
    .eq('event_year', year)  // <- FILTER BY YEAR
    .order('created_at', { ascending: false });
}
```

**Fix Required:**
1. Accept year parameter
2. Add `.eq('event_year', year)` to query
3. Get year from search params or context

**Estimated Fix Time:** 15 minutes

---

### BUG-004: Participant Queries Not Year-Filtered
**Severity:** CRITICAL
**Status:** Open
**Component:** Data Fetching
**File:** `/home/stian/Repos/barteløpet/app/deltakere/page.tsx`

**Description:**
Similar to BUG-003, participant listings fetch data across all years.

**Impact:**
- Shows all registrations ever made
- Wrong participant counts
- Cannot view year-specific participant lists
- Bib numbers from different years shown together

**Fix Required:**
Add year filter to participant queries.

**Estimated Fix Time:** 15 minutes

---

### BUG-005: Dashboard Not Year-Aware
**Severity:** CRITICAL
**Status:** Open
**Component:** User Dashboard
**File:** `/home/stian/Repos/barteløpet/app/dashboard/page.tsx`

**Description:**
Dashboard queries participant and completion without year filter, potentially showing wrong data if user participated multiple years.

**Impact:**
- User sees wrong completion data
- Vote counts may be incorrect
- Cannot view historical participations
- No indication of which year's data is shown

**Current Code:**
```typescript
const { data: participant } = await supabase
  .from('participants')
  .select('*')
  .eq('user_id', user.id)
  .single();  // Gets first match, may be wrong year!

const { data: completion } = await supabase
  .from('completions')
  .select('*')
  .eq('participant_id', participant.id)
  .single();  // May get wrong year!
```

**Fix Required:**
1. Add event_year filter to both queries
2. Show year selector on dashboard
3. Allow viewing historical years

**Estimated Fix Time:** 30 minutes

---

### BUG-006: Registration Doesn't Set event_year
**Severity:** CRITICAL
**Status:** Open
**Component:** Registration Form
**File:** `/home/stian/Repos/barteløpet/app/pamelding/page.tsx`

**Description:**
When new participants register, the event_year field is not explicitly set. It relies on database default (2024), which is incorrect for future years.

**Impact:**
- New 2025 registrations may be assigned to 2024
- Data integrity violation
- Users registered in wrong year
- Cannot register for current event

**Fix Required:**
```typescript
const currentYear = getCurrentEventYear();

await supabase.from('participants').insert({
  ...participantData,
  event_year: currentYear  // <- ADD THIS
});
```

**Estimated Fix Time:** 10 minutes

---

### BUG-007: Completion Submission Doesn't Set event_year
**Severity:** CRITICAL
**Status:** Open
**Component:** Submission Form
**File:** `/home/stian/Repos/barteløpet/app/send-inn/page.tsx`

**Description:**
Similar to BUG-006, completion submissions don't set event_year.

**Impact:**
- Completions saved to wrong year
- Vote isolation broken
- Data corruption across years

**Fix Required:**
Add event_year to completion insert.

**Estimated Fix Time:** 10 minutes

---

## High Priority Bugs (P1) - Major Functionality Missing

### BUG-008: No Year Selector UI Component
**Severity:** HIGH
**Status:** Open
**Component:** UI/UX
**Files:** Missing component

**Description:**
There is no UI component for users to select/switch between event years. The year context exists but cannot be controlled.

**Impact:**
- Users cannot view historical data
- Stuck on default year
- Multi-year features inaccessible

**Fix Required:**
Create `components/year-selector.tsx` with:
- Dropdown or tab UI for year selection
- Display available years from `getAvailableYears()`
- Update context on selection
- Show current selected year

**Estimated Fix Time:** 1 hour

---

### BUG-009: November Edit Window Not Enforced
**Severity:** HIGH
**Status:** Open
**Component:** Access Control
**Files:** Multiple

**Description:**
The requirement states "Can submit/edit runs ONLY in November of current year" but there are no frontend checks enforcing this.

**Impact:**
- Users can edit outside November
- Historical data can be modified
- Data integrity at risk
- Business rules violated

**Fix Required:**
1. Check `isSubmissionWindowOpen()` before showing edit forms
2. Disable edit buttons if not November
3. Show appropriate error messages
4. Add November status indicator

**Estimated Fix Time:** 2 hours

---

### BUG-010: Past Years Not Read-Only
**Severity:** HIGH
**Status:** Open
**Component:** Access Control
**Files:** Multiple

**Description:**
Historical year data should be read-only, but edit controls are shown regardless of year.

**Impact:**
- Users can attempt to edit past years
- Confusion about what's editable
- Potential data corruption

**Fix Required:**
1. Check `isCurrentYear()` before showing edit controls
2. Hide edit buttons for historical data
3. Add "Historical Data" banner for past years
4. Disable form inputs for non-current years

**Estimated Fix Time:** 1.5 hours

---

### BUG-011: No Participant History View
**Severity:** HIGH
**Status:** Open
**Component:** Dashboard Feature
**File:** `/home/stian/Repos/barteløpet/app/dashboard/page.tsx`

**Description:**
The `get_participant_history()` database function exists but is not called by frontend. Users cannot view their multi-year history.

**Impact:**
- Cannot see previous years' results
- No sense of multi-year progression
- Missing key feature
- Poor UX for returning participants

**Fix Required:**
1. Call `get_participant_history()` from dashboard
2. Display history in table or timeline format
3. Show year-by-year stats (bib number, votes, completion date)
4. Allow clicking to view historical completion details

**Estimated Fix Time:** 2 hours

---

## Medium Priority Bugs (P2) - Quality/UX Issues

### BUG-012: No Visual Indication of Selected Year
**Severity:** MEDIUM
**Status:** Open
**Component:** UI/UX
**Files:** All page components

**Description:**
Even when year selection is implemented, there's no persistent visual indicator of which year is being viewed.

**Impact:**
- User confusion about current context
- May not realize they're viewing historical data
- Poor UX

**Fix Required:**
1. Add year badge to page headers
2. Show "Viewing 2024" indicator
3. Different styling for historical vs current year
4. Breadcrumb showing year context

**Estimated Fix Time:** 1 hour

---

### BUG-013: No Submission Window Status Messages
**Severity:** MEDIUM
**Status:** Open
**Component:** User Feedback
**Files:** Dashboard, submission pages

**Description:**
Users aren't informed about submission window status (open, closed, when it opens).

**Impact:**
- Confusion about why submission is disabled
- No guidance on when to return
- Poor user communication

**Fix Required:**
Use `getSubmissionWindowText()` utility to show:
- "Submission window is open for 2024"
- "Submission window closed on November 30, 2024"
- "Submission window opens November 1, 2025"

**Estimated Fix Time:** 30 minutes

---

### BUG-014: Vote Queries Not Year-Filtered
**Severity:** MEDIUM
**Status:** Open
**Component:** Voting System
**File:** `/home/stian/Repos/barteløpet/app/galleri/page.tsx`

**Description:**
The `getUserVote()` function doesn't filter by year, so a user who voted in 2024 will see their vote highlighted even when viewing 2025.

**Impact:**
- Incorrect vote indicators
- May think they've already voted in new year
- Voting UX confusion

**Current Code:**
```typescript
const { data: vote } = await supabase
  .from('votes')
  .select('completion_id')
  .eq('voter_id', participant.id)
  .single();  // NO YEAR FILTER
```

**Fix Required:**
Add `.eq('event_year', year)` to query.

**Estimated Fix Time:** 10 minutes

---

### BUG-015: Comment Queries Not Year-Filtered
**Severity:** MEDIUM
**Status:** Open
**Component:** Comments System
**Files:** Comment components

**Description:**
Photo comment queries don't filter by event_year.

**Impact:**
- Comments from different years may appear mixed
- Comment counts incorrect

**Fix Required:**
Add year filter to comment queries.

**Estimated Fix Time:** 10 minutes

---

## Low Priority Bugs (P3) - Nice to Have

### BUG-016: No Year in URL Routing Structure
**Severity:** LOW
**Status:** Open
**Component:** Routing
**Files:** Multiple

**Description:**
Year is only stored in URL query parameter (?year=2024) rather than in path structure (/2024/galleri).

**Impact:**
- Less SEO friendly
- URLs less semantic
- Bookmarking experience suboptimal

**Fix Required:**
Consider restructuring routes to include year in path.

**Estimated Fix Time:** 4+ hours (significant refactor)

---

### BUG-017: No Multi-Year Statistics
**Severity:** LOW
**Status:** Open
**Component:** Dashboard Analytics
**Files:** Dashboard

**Description:**
No aggregate statistics showing:
- Total participations across years
- Average votes per year
- Participation streak
- Year-over-year comparisons

**Impact:**
- Missing "gamification" elements
- Less engaging for repeat participants
- Missed opportunity for user engagement

**Fix Required:**
Create statistics component analyzing multi-year data.

**Estimated Fix Time:** 3 hours

---

### BUG-018: No Year Transition Warnings
**Severity:** LOW
**Status:** Open
**Component:** User Communication
**Files:** Dashboard

**Description:**
No warnings or notifications when:
- New event year starts
- Submission window opens
- Submission window about to close

**Impact:**
- Users miss important dates
- Lower participation

**Fix Required:**
Add notification banner for year transitions.

**Estimated Fix Time:** 1 hour

---

## Bug Summary Statistics

| Severity | Count | % of Total |
|----------|-------|------------|
| Critical (P0) | 7 | 39% |
| High (P1) | 4 | 22% |
| Medium (P2) | 5 | 28% |
| Low (P3) | 3 | 17% |
| **TOTAL** | **18** | **100%** |

---

## Bugs by Component

| Component | Critical | High | Medium | Low | Total |
|-----------|----------|------|--------|-----|-------|
| Type Definitions | 1 | 0 | 0 | 0 | 1 |
| Layout Provider | 1 | 0 | 0 | 0 | 1 |
| Data Fetching | 4 | 0 | 2 | 0 | 6 |
| Access Control | 0 | 2 | 0 | 0 | 2 |
| UI Components | 0 | 2 | 1 | 1 | 4 |
| User Feedback | 0 | 0 | 1 | 2 | 3 |
| Routing | 0 | 0 | 0 | 1 | 1 |

---

## Resolution Roadmap

### Sprint 1: Critical Fixes (4 hours)
1. BUG-001: Update type definitions (30 min)
2. BUG-002: Add YearProvider to layout (5 min)
3. BUG-003: Filter gallery queries (15 min)
4. BUG-004: Filter participant queries (15 min)
5. BUG-005: Fix dashboard queries (30 min)
6. BUG-006: Set event_year in registration (10 min)
7. BUG-007: Set event_year in submissions (10 min)
8. BUG-014: Filter vote queries (10 min)
9. BUG-015: Filter comment queries (10 min)

### Sprint 2: High Priority (6.5 hours)
10. BUG-008: Create year selector UI (1 hour)
11. BUG-009: Enforce November window (2 hours)
12. BUG-010: Make past years read-only (1.5 hours)
13. BUG-011: Add participant history view (2 hours)

### Sprint 3: Medium Priority (2.5 hours)
14. BUG-012: Add year visual indicators (1 hour)
15. BUG-013: Show submission status messages (30 min)

### Sprint 4: Low Priority (8 hours)
16. BUG-016: URL routing refactor (4 hours)
17. BUG-017: Multi-year statistics (3 hours)
18. BUG-018: Year transition warnings (1 hour)

**Total Estimated Fix Time:** 21 hours

---

## Testing Dependencies

**Cannot begin testing until:**
- ✅ Sprint 1 completed (Critical fixes)
- ✅ Sprint 2 completed (High priority fixes)

**Can test with limitations after:**
- ✅ Sprint 1 only (basic year functionality works)

**Full feature testing requires:**
- ✅ Sprint 1 + Sprint 2 completed

---

**Report Generated:** 2025-10-29 14:51 UTC
**QA Engineer:** QA_ENGINEER Agent
**Total Bugs Found:** 18
**Critical Bugs:** 7
**High Priority Bugs:** 4
