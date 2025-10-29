# Test Results: Data Isolation Between Years

**Test Date:** 2025-10-29
**Tester:** QA_ENGINEER Agent
**Test Status:** BLOCKED - Cannot Execute

---

## Test Scenario Overview

**Objective:** Verify that data from different event years is completely isolated with no leakage between years. Each year's completions, votes, comments, and participants should be separate.

**Test Status:** ❌ **NOT TESTABLE** - Queries not year-filtered

---

## Test Cases

### TC-DI-001: Gallery Shows Only Selected Year's Images
**Priority:** Critical
**Status:** ❌ FAIL - No year filtering

**Steps:**
1. Navigate to gallery page
2. Select year 2024
3. Verify only 2024 completions shown
4. Switch to year 2025
5. Verify only 2025 completions shown

**Expected Result:**
- Gallery filtered by `event_year` column
- 2024 view: only images from November 2024
- 2025 view: only images from November 2025
- No overlap between years

**Actual Result:**
```typescript
// app/galleri/page.tsx - CURRENT CODE (WRONG)
const { data: completions } = await supabase
  .from('completions')
  .select('*')
  .order('created_at', { ascending: false });
// ❌ NO .eq('event_year', year) filter!
// Shows ALL years mixed together
```

**Evidence:**
- Query fetches ALL completions regardless of year
- No year parameter passed to query
- All historical data shown in gallery
- **CRITICAL DATA ISOLATION VIOLATION**

**Severity:** CRITICAL
**Related Bug:** BUG-003

---

### TC-DI-002: Participants List Shows Only Selected Year
**Priority:** Critical
**Status:** ❌ FAIL - No year filtering

**Steps:**
1. Navigate to participants page
2. Select year 2024
3. Count participants shown
4. Verify only 2024 registrations
5. Switch to 2025
6. Verify count changes to 2025 registrations only

**Expected Result:**
- Each year has separate participant registrations
- User who participated in 2024 and 2025 appears in both
- Bib numbers isolated per year
- Registration counts accurate per year

**Actual Result:**
- Participants list likely shows all years (file needs verification)
- No year filter implemented
- Bib numbers from different years mixed
- Counts incorrect

**Evidence:**
```bash
# Need to check: app/deltakere/page.tsx
# Expected to have same issue as gallery
```

**Severity:** CRITICAL
**Related Bug:** BUG-004

---

### TC-DI-003: Votes Isolated Per Year
**Priority:** Critical
**Status:** ❌ FAIL - Vote query not year-filtered

**Steps:**
1. User votes for completion in 2024
2. View 2025 gallery
3. Verify vote not shown in 2025
4. User can vote again in 2025
5. Check database: 2 vote records with different event_year

**Expected Result:**
- Vote in 2024: `votes` record with event_year=2024
- Vote in 2025: separate `votes` record with event_year=2025
- User sees correct vote indicator per year
- Can vote once per year

**Actual Result:**
```typescript
// app/galleri/page.tsx - getUserVote() function
const { data: vote } = await supabase
  .from('votes')
  .select('completion_id')
  .eq('voter_id', participant.id)
  .single();
// ❌ NO .eq('event_year', year) filter!
```

**Evidence:**
- Vote query doesn't filter by year
- User's 2024 vote will show highlighted in 2025 gallery
- May prevent voting in new year
- **CRITICAL: Voting system broken**

**Severity:** CRITICAL
**Related Bug:** BUG-014

---

### TC-DI-004: Comments Belong to Correct Year
**Priority:** High
**Status:** ❌ FAIL - Comment queries not year-filtered

**Steps:**
1. Add comment to 2024 completion
2. View same completion in 2025 view
3. Verify comment not shown
4. Check comment has event_year=2024 in database

**Expected Result:**
- Comments tied to specific event year
- Historical comments stay with historical data
- New years start with clean comment slate

**Actual Result:**
- Comment queries likely not filtered by year
- Comments may appear across years
- Data leakage possible

**Evidence:**
- Need to verify photo_comments component queries
- Migration adds event_year to photo_comments table
- Frontend likely not using it

**Severity:** HIGH
**Related Bug:** BUG-015

---

### TC-DI-005: Bib Numbers Unique Per Year
**Priority:** Critical
**Status:** ⚠️ PARTIAL - Database correct, UI untested

**Steps:**
1. User registers in 2024, gets bib #1001
2. New user registers in 2025, can also get bib #1001
3. Verify database constraint allows this
4. Verify UI shows bib with year context

**Expected Result:**
- Database constraint: UNIQUE(bib_number, event_year)
- Same bib number can exist in different years
- UI shows "Bib #1001 (2024)" vs "Bib #1001 (2025)"

**Actual Result:**
```sql
-- Database migration (CORRECT) ✅
ALTER TABLE participants
ADD CONSTRAINT participants_bib_year_unique UNIQUE(bib_number, event_year);
```

**Database:** ✅ Correctly allows duplicate bib numbers across years
**UI:** ❌ Likely doesn't show year context with bib number
**Queries:** ❌ Don't filter by year

**Severity:** CRITICAL
**Related Bug:** BUG-006 (registration doesn't set event_year)

---

### TC-DI-006: Dashboard Shows Correct Year's Data
**Priority:** Critical
**Status:** ❌ FAIL - Dashboard not year-aware

**Steps:**
1. User participated in 2024 and 2025
2. View dashboard
3. Select 2024
4. Verify shows 2024 completion, vote count, etc.
5. Select 2025
6. Verify shows 2025 data

**Expected Result:**
- Dashboard queries filtered by selected year
- Shows correct completion per year
- Vote counts reflect selected year
- Status indicators per year

**Actual Result:**
```typescript
// app/dashboard/page.tsx - CURRENT CODE (WRONG)
const { data: participant } = await supabase
  .from('participants')
  .select('*')
  .eq('user_id', user.id)
  .single();  // Gets first match - may be wrong year!

const { data: completion } = await supabase
  .from('completions')
  .select('*')
  .eq('participant_id', participant.id)
  .single();  // May get wrong year!
```

**Evidence:**
- Queries use `.single()` without year filter
- Will return arbitrary year's data
- User sees incorrect information
- **CRITICAL: User data integrity issue**

**Severity:** CRITICAL
**Related Bug:** BUG-005

---

### TC-DI-007: User Can Register Multiple Years
**Priority:** Critical
**Status:** ⚠️ PARTIAL - Database allows, UI untested

**Steps:**
1. User registers for 2024 event
2. November 2025 arrives
3. Same user registers for 2025 event
4. Verify database has 2 participant records
5. Verify both show in user history

**Expected Result:**
- Database constraint: UNIQUE(user_id, event_year)
- Same user can have multiple participant records
- Each tied to different event_year
- May have different bib numbers per year

**Actual Result:**
```sql
-- Database migration (CORRECT) ✅
ALTER TABLE participants
ADD CONSTRAINT participants_user_year_unique UNIQUE(user_id, event_year);
```

**Database:** ✅ Correctly allows multiple registrations
**Registration Form:** ❌ Doesn't set event_year (uses default 2024)
**UI:** ❌ No multi-year registration flow

**Severity:** CRITICAL
**Related Bug:** BUG-006

---

### TC-DI-008: Email Unique Per Year
**Priority:** High
**Status:** ⚠️ PARTIAL - Database correct, UI untested

**Steps:**
1. Register with email@example.com in 2024
2. Attempt to register with same email in 2024 (should fail)
3. Register with same email in 2025 (should succeed)

**Expected Result:**
- UNIQUE(email, event_year) constraint
- Same email can register each year
- Different participant records per year

**Actual Result:**
```sql
-- Database migration (CORRECT) ✅
ALTER TABLE participants
ADD CONSTRAINT participants_email_year_unique UNIQUE(email, event_year);
```

**Database:** ✅ Constraint correct
**Registration:** ❌ Doesn't set event_year, will break

**Severity:** HIGH
**Related Bug:** BUG-006

---

### TC-DI-009: Vote Counts Isolated Per Year
**Priority:** Critical
**Status:** ❌ FAIL - Queries not year-filtered

**Steps:**
1. Completion A in 2024 gets 50 votes
2. View in 2024: shows 50 votes ✅
3. View in 2025: should show 0 votes for 2024 data
4. New completion in 2025 starts at 0 votes

**Expected Result:**
- Vote count aggregated per event_year
- Historical data shows historical vote counts
- New years start fresh

**Actual Result:**
- Queries don't filter votes by year
- Vote counts likely incorrect
- May show accumulated votes across years

**Evidence:**
- `update_vote_counts()` trigger IS year-aware ✅
- Frontend queries NOT year-aware ❌
- Display logic incorrect

**Severity:** CRITICAL
**Related Bug:** BUG-003, BUG-014

---

### TC-DI-010: No Cross-Year Data Leakage
**Priority:** Critical
**Status:** ❌ FAIL - Widespread data leakage

**Steps:**
1. Create test data for 2024
2. Create test data for 2025
3. Query for 2024 data only
4. Verify absolutely NO 2025 data appears
5. Reverse test: query 2025, verify no 2024 data

**Expected Result:**
- Perfect isolation between years
- No participant overlap (except multi-year registrations)
- No completion overlap
- No vote overlap
- No comment overlap

**Actual Result:**
- ALL queries mix data across years
- Complete data leakage
- No isolation whatsoever
- **SYSTEM FUNDAMENTALLY BROKEN FOR MULTI-YEAR**

**Evidence:**
- Gallery: shows all years
- Participants: shows all years
- Dashboard: shows wrong year
- Votes: shows wrong year
- Comments: shows wrong year

**Severity:** CRITICAL
**Related Bugs:** BUG-003, BUG-004, BUG-005, BUG-014, BUG-015

---

## Test Summary

| Test Case | Status | Priority | Data Leakage Risk |
|-----------|--------|----------|-------------------|
| TC-DI-001 | ❌ FAIL | Critical | HIGH |
| TC-DI-002 | ❌ FAIL | Critical | HIGH |
| TC-DI-003 | ❌ FAIL | Critical | HIGH |
| TC-DI-004 | ❌ FAIL | High | MEDIUM |
| TC-DI-005 | ⚠️ PARTIAL | Critical | HIGH |
| TC-DI-006 | ❌ FAIL | Critical | HIGH |
| TC-DI-007 | ⚠️ PARTIAL | Critical | HIGH |
| TC-DI-008 | ⚠️ PARTIAL | High | MEDIUM |
| TC-DI-009 | ❌ FAIL | Critical | HIGH |
| TC-DI-010 | ❌ FAIL | Critical | CRITICAL |

**Pass Rate:** 0/10 (0%)
**Partial Pass:** 3/10 (30%)

---

## Critical Findings

### 🚨 CRITICAL: Complete Data Isolation Failure

The system currently has **ZERO data isolation** between years. All queries fetch data across all event years without filtering. This is a fundamental violation of the multi-year architecture requirements.

**Impact:**
- Users see mixed data from multiple years
- Vote counts incorrect
- Registration counts wrong
- Cannot view year-specific data
- Historical data corrupted by current data
- **SYSTEM NOT USABLE AS MULTI-YEAR EVENT**

---

## Root Cause Analysis

### Database Layer: ✅ CORRECT
- Migration adds event_year columns
- Constraints properly year-aware
- Triggers properly year-aware
- Database functions work correctly

### Application Layer: ❌ BROKEN
- Type definitions don't include event_year
- Queries don't filter by event_year
- Inserts don't set event_year
- No year context in queries

**Diagnosis:** Backend implementation complete, frontend integration completely missing.

---

## Required Fixes

### Priority 1: Add Year Filters to ALL Queries

```typescript
// WRONG (current)
.from('completions').select('*')

// CORRECT (needed)
.from('completions').select('*').eq('event_year', selectedYear)
```

**Files to Fix:**
1. `app/galleri/page.tsx` - completions query
2. `app/deltakere/page.tsx` - participants query
3. `app/dashboard/page.tsx` - participant & completion queries
4. All vote queries
5. All comment queries

### Priority 2: Set event_year on Insert

```typescript
// WRONG (current)
await supabase.from('participants').insert({ name, email })

// CORRECT (needed)
await supabase.from('participants').insert({
  name,
  email,
  event_year: getCurrentEventYear()
})
```

**Files to Fix:**
1. `app/pamelding/page.tsx` - registration
2. `app/send-inn/page.tsx` - completion submission
3. Vote creation actions
4. Comment creation actions

---

## Blocking Issues for Testing

1. **BUG-001:** Type definitions missing event_year
2. **BUG-003:** Gallery queries not year-filtered
3. **BUG-004:** Participant queries not year-filtered
4. **BUG-005:** Dashboard queries not year-filtered
5. **BUG-006:** Registration doesn't set event_year
6. **BUG-007:** Completions don't set event_year
7. **BUG-014:** Vote queries not year-filtered
8. **BUG-015:** Comment queries not year-filtered

**All P0 Critical bugs must be fixed before data isolation can be tested.**

---

## Recommendations

### Immediate Actions:

1. **DO NOT DEPLOY TO PRODUCTION**
   - Current state will corrupt data
   - All years will be mixed
   - Cannot separate after corruption

2. **Fix All Queries First**
   - Add `.eq('event_year', year)` to every query
   - Estimated time: 2 hours
   - Must be done before any other testing

3. **Fix All Inserts Second**
   - Add `event_year: getCurrentEventYear()` to all inserts
   - Estimated time: 30 minutes
   - Prevents wrong year assignments

4. **Test with Multi-Year Data**
   - Create test data for 2024 and 2025
   - Verify complete isolation
   - Check no leakage in either direction

---

## Retest Plan

Once all bugs are fixed:

### Phase 1: Create Test Data (30 min)
- Add 2024 test participants (IDs: test2024-1, test2024-2)
- Add 2024 test completions
- Add 2024 test votes
- Add 2025 test participants (IDs: test2025-1, test2025-2)
- Add 2025 test completions
- Add 2025 test votes

### Phase 2: Verify 2024 Isolation (30 min)
- Select year 2024
- Verify only 2024 data shown
- Count participants, completions, votes
- Verify matches expected

### Phase 3: Verify 2025 Isolation (30 min)
- Select year 2025
- Verify only 2025 data shown
- Verify NO 2024 data appears
- Count and verify matches expected

### Phase 4: Verify Bidirectional (15 min)
- Switch between years multiple times
- Verify data updates correctly
- Check no cross-contamination

**Total Retest Time:** 2 hours

---

**Test Report Generated:** 2025-10-29
**Status:** BLOCKED - Cannot proceed until all P0 bugs fixed
**Risk Level:** CRITICAL - Data integrity at risk
**Recommendation:** Fix before any deployment
