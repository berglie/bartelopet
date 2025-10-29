# Test Results: Year Selection

**Test Date:** 2025-10-29
**Tester:** QA_ENGINEER Agent
**Test Status:** BLOCKED - Cannot Execute

---

## Test Scenario Overview

**Objective:** Validate that users can switch between event years and that the system correctly updates all content based on the selected year.

**Test Status:** ❌ **NOT TESTABLE** - Feature not implemented

---

## Test Cases

### TC-YS-001: Year Selector Component Exists
**Priority:** Critical
**Status:** ❌ FAIL - Component does not exist

**Steps:**
1. Navigate to any page of the application
2. Look for year selector component in UI

**Expected Result:**
- Year selector visible in navigation or page header
- Shows current year as selected
- Displays list of available years (2024, 2025+)

**Actual Result:**
- No year selector component found
- No UI element for year selection
- Component file does not exist: `components/year-selector.tsx`

**Evidence:**
```bash
$ find . -name "*year-selector*"
# No results
```

---

### TC-YS-002: Default Year is Current Event Year
**Priority:** Critical
**Status:** ❌ BLOCKED - Cannot test without year selector

**Steps:**
1. Open application for first time
2. Check which year's data is displayed

**Expected Result:**
- System shows current event year by default
- As of Oct 2025, should show 2024 (since event is in November)
- After Nov 2025, should show 2025

**Actual Result:**
- Cannot determine which year is shown
- No visual indication of year
- All years' data mixed together

---

### TC-YS-003: Switch Between Years
**Priority:** Critical
**Status:** ❌ BLOCKED - Cannot test without year selector

**Steps:**
1. Select year 2024 from year selector
2. Observe page content
3. Select year 2025 from year selector
4. Observe page content changes

**Expected Result:**
- Page content updates immediately
- Gallery shows only 2024 images → then only 2025 images
- Participant list updates
- Vote counts reflect selected year
- Smooth transition with loading state

**Actual Result:**
- Cannot execute test - no year selector
- No way to switch years

---

### TC-YS-004: Year Persists in URL
**Priority:** High
**Status:** ❌ BLOCKED - Cannot test without year selector

**Steps:**
1. Select year 2024
2. Check browser URL
3. Refresh page
4. Verify year selection persists

**Expected Result:**
- URL shows `?year=2024` parameter
- After refresh, still viewing 2024
- Year context maintained

**Actual Result:**
- Cannot test - year selection not implemented

---

### TC-YS-005: Browser Back/Forward with Year Changes
**Priority:** High
**Status:** ❌ BLOCKED - Cannot test without year selector

**Steps:**
1. View 2024 (default)
2. Switch to 2025
3. Press browser back button
4. Verify returns to 2024

**Expected Result:**
- Browser history includes year changes
- Back button returns to previous year
- Forward button advances to next year
- URL and content stay in sync

**Actual Result:**
- Cannot test - year selection not implemented

---

### TC-YS-006: Year Context Available to Components
**Priority:** Critical
**Status:** ❌ FAIL - YearProvider not in layout

**Steps:**
1. Check root layout file
2. Verify YearProvider wraps application
3. Test useYear() hook in component

**Expected Result:**
- `app/layout.tsx` imports and uses YearProvider
- All child components can access year context
- `useYear()` hook works without errors

**Actual Result:**
```typescript
// app/layout.tsx - MISSING YearProvider
export default function RootLayout({ children }) {
  return (
    <html lang="nb-NO">
      <body>
        <Navigation />
        <main>{children}</main>  // No YearProvider wrapper!
      </body>
    </html>
  );
}
```

**Evidence:**
- YearProvider exists: ✅ `/home/stian/Repos/barteløpet/contexts/year-context.tsx`
- YearProvider used in layout: ❌ Not imported or used
- Result: Any component calling `useYear()` will throw error

---

### TC-YS-007: Invalid Year Handling
**Priority:** Medium
**Status:** ❌ BLOCKED - Cannot test without year selector

**Steps:**
1. Manually set URL to `?year=2030` (future year)
2. Observe system behavior
3. Try `?year=2020` (before event start)
4. Try `?year=abc` (invalid format)

**Expected Result:**
- Invalid years rejected
- System falls back to current year
- Error message or notification shown
- URL corrected to valid year

**Actual Result:**
- Cannot test - year validation not implemented in UI

---

### TC-YS-008: Available Years List is Correct
**Priority:** Medium
**Status:** ⚠️ PARTIAL - Function exists but not used

**Steps:**
1. Check `getAvailableYears()` function
2. Verify it returns correct year range
3. Check year selector displays these years

**Expected Result:**
- Function returns [2024, 2025, ...current year]
- Year selector shows only these years
- Cannot select future years

**Actual Result:**
```typescript
// lib/utils/year.ts - Function EXISTS ✅
export function getAvailableYears(): number[] {
  const currentEventYear = getCurrentEventYear();
  const years: number[] = [];
  for (let year = 2024; year <= currentEventYear; year++) {
    years.push(year);
  }
  return years;
}

// But NOT USED anywhere in UI ❌
```

**Evidence:**
- Utility function implemented correctly
- No component calls this function
- Year selector component does not exist

---

## Test Summary

| Test Case | Status | Priority | Blocker |
|-----------|--------|----------|---------|
| TC-YS-001 | ❌ FAIL | Critical | BUG-008 |
| TC-YS-002 | ❌ BLOCKED | Critical | BUG-008 |
| TC-YS-003 | ❌ BLOCKED | Critical | BUG-008 |
| TC-YS-004 | ❌ BLOCKED | High | BUG-002, BUG-008 |
| TC-YS-005 | ❌ BLOCKED | High | BUG-002, BUG-008 |
| TC-YS-006 | ❌ FAIL | Critical | BUG-002 |
| TC-YS-007 | ❌ BLOCKED | Medium | BUG-008 |
| TC-YS-008 | ⚠️ PARTIAL | Medium | BUG-008 |

**Pass Rate:** 0/8 (0%)

---

## Blocking Issues

1. **BUG-002:** YearProvider not included in root layout
   - Prevents year context from being available
   - Must fix before any year-based testing

2. **BUG-008:** No year selector UI component
   - Cannot switch years without UI
   - Must create component before testing selection

---

## Dependencies to Unblock Testing

### Must Complete:
1. Add YearProvider to `app/layout.tsx`
2. Create `components/year-selector.tsx`
3. Add year selector to navigation or page headers
4. Connect year selector to YearContext

### Estimated Fix Time:
- BUG-002: 5 minutes
- BUG-008: 1 hour
- **Total: 1 hour 5 minutes**

---

## Recommendations

1. **Immediate Action:** Add YearProvider to layout (quick fix)
2. **Next Priority:** Create year selector component
3. **Design Decision Needed:** Where should year selector appear?
   - Option A: In main navigation
   - Option B: As page-level tabs
   - Option C: As dropdown in page header
4. **Consider:** Mobile experience for year selector
5. **Remember:** Update all queries to use selected year (separate bug)

---

## Retest Plan

Once blockers are resolved, execute tests in this order:

1. **Phase 1:** TC-YS-006 (Context availability)
2. **Phase 2:** TC-YS-001, TC-YS-008 (Component existence)
3. **Phase 3:** TC-YS-002, TC-YS-003 (Basic functionality)
4. **Phase 4:** TC-YS-004, TC-YS-005 (URL/history integration)
5. **Phase 5:** TC-YS-007 (Error handling)

**Estimated Testing Time:** 30 minutes (after implementation)

---

**Test Report Generated:** 2025-10-29
**Status:** Cannot proceed with testing
**Next Action:** Resolve blocking bugs BUG-002 and BUG-008
