# Code Review Instructions

Use this file only for pull request review behavior.

General project context lives in `AGENTS.md` and `README.md`. If this file and `AGENTS.md` differ, follow this file for review severity and review focus.

## Primary Review Goal

Prioritize real production-impacting problems over style commentary.

Focus on:

- behavioral regressions
- correctness bugs
- security issues
- authentication, admin access, and RLS mistakes
- exposure of participants' personal data
- unfair or non-reproducible prize draws
- missing tests when the change is risky

## Severity

Treat a finding as `Important` when it can:

- break user-facing behavior (sign-up, registering runs, gallery, voting, draws)
- corrupt or expose data
- bypass auth, admin checks, or RLS protections
- create a meaningful security vulnerability
- leak personal data (email, phone, address) to other participants or the public

Treat a finding as `Nit` when it is:

- a maintainability issue
- a minor consistency problem
- a documentation or instruction mismatch
- a lower-risk test gap

Do not raise `Important` findings for formatting, naming preferences, or issues already enforced reliably by existing tooling (ESLint, Prettier, TypeScript).

## Review Focus For This Repo

Pay special attention to:

- server actions in `app/actions/`: every mutation must check the signed-in user, and admin actions must check `is_event_admin()` on the server
- API routes in `app/api/` and rate limiting via `app/_shared/lib/utils/rate-limit.ts`
- `proxy.ts`: protected paths, session refresh, and the Content-Security-Policy nonce
- new migrations in `supabase/migrations/`: a new table without `ENABLE ROW LEVEL SECURITY` and policies in the same migration is `Important`
- views exposed to `anon`/`authenticated` must use `security_invoker` and must not expose personal data columns
- `SECURITY DEFINER` functions without a fixed `search_path` are `Important`
- event year handling (`contexts/year-context.tsx`): data from one year must not leak into another
- draw logic (`app/trekning/`, `app/actions/admin-2026.ts`) and run/submission windows
- Supabase client usage: the service role key must never reach client components
- user-facing text is Norwegian; flag wording that contradicts the terms (`app/vilkar/`) or privacy page (`app/personvern/`)

## Noise Reduction

- Prefer fewer, higher-signal findings over broad nitpicking
- Report at most five nit-level findings in one review
- Skip lockfiles, generated artifacts, and purely mechanical formatting churn unless they hide a real bug
- If no actionable issues are found, say so briefly
