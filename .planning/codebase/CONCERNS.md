# CONCERNS.md — Technical Debt, Issues & Areas of Concern

## Critical Issues

### No Test Coverage
- **Zero tests** across all 11 source modules
- Scoring math (`simulation.ts`), chain parsing (`chain.ts`), and projection logic (`lab.ts`) are entirely untested
- Regressions are only caught manually
- **Risk:** High — any refactor can silently break core functionality

### God Component — `src/App.tsx`
- All data fetching, state management, tab routing, and leaderboard rendering live in one file
- Makes it hard to reason about, test, or extend individual concerns
- **Risk:** Medium — growing complexity with each feature addition

---

## Performance Bottlenecks

### Heavy Leaderboard Re-renders
- No `useMemo` or `useCallback` on expensive derived data (sorted/filtered user lists)
- Full re-render triggered by any state change in `App.tsx`
- **Impact:** Noticeable jank at 500+ users

### Missing Memoization on Simulation Results
- `simulation.ts` computations re-run on every render cycle
- Results should be memoized until input chain data changes

### Batch Error Context Loss
- `Promise.allSettled` in `api.ts` swallows per-request error context
- Failed batch items are silently dropped with no user feedback
- **Scaling limit:** Performance degrades noticeably beyond 500–1000 users

---

## Data Consistency Issues

### Timestamp Mismatches
- Chain timestamps (block-based) vs. wall clock time used inconsistently in lock expiry calculations
- Can cause locks to appear expired/active incorrectly near boundaries

### Lock Extension Validation Gaps
- No validation that extended lock end dates are in the future
- Edge case: locks extended to past dates accepted without error

### Stale Data — No Indicators
- No visual indicator when displayed data is stale (e.g., RPC fetch was minutes ago)
- Users have no way to know if leaderboard reflects current chain state

---

## Error Handling Gaps

### Silent API Failures
- Many RPC call failures in `api.ts` are caught and swallowed
- User sees stale/empty data with no error message

### JSON Parsing Without Logging
- `JSON.parse` calls lack try-catch or logging in several places
- Malformed RPC responses cause silent failures

### Non-Actionable Error Messages
- Generic "Something went wrong" messages with no retry affordance
- No per-user recovery — one failed fetch affects entire batch display

---

## Security Considerations

### Hardcoded RPC Endpoints
- RPC URLs are hardcoded in `constants.ts` with no env-var override
- Endpoint rotation or environment switching requires code changes

### Missing API Response Verification
- RPC responses are trusted without schema validation
- Malformed/malicious responses could corrupt UI state

---

## Fragile Areas

### Pagination Logic (`api.ts`)
- Off-by-one risk in page boundary calculations
- No test coverage — silent data gaps possible

### veGNET Calculations (`chain.ts`)
- Decay curve math is non-trivial and domain-specific
- Edge cases (zero lock, max lock, just-expired) untested

### Reputation Edge Cases
- Reputation scoring has boundary conditions that haven't been verified against contract behaviour

### Known UI Bugs
- Scroll behavior issues in leaderboard table on mobile
- Stale hint text updates in simulator column
- Month label inconsistencies in Lab projection chart

---

## Missing Features (Debt)

| Feature | Impact |
|---------|--------|
| Stale data indicators | UX — users can't tell data freshness |
| Per-user error recovery | UX — one bad fetch shouldn't blank a row |
| Parameter validation on Lab inputs | Correctness — invalid inputs produce nonsense projections |
| Structured logging | Observability — no way to diagnose production issues |
| RPC endpoint configurability | Ops — hardcoded URLs are inflexible |

---

## Tech Debt Summary

| Area | Severity | Effort to Fix |
|------|----------|--------------|
| No tests | High | High |
| God component (App.tsx) | Medium | High |
| Missing memoization | Medium | Low |
| Silent error handling | Medium | Medium |
| Hardcoded RPC endpoints | Low | Low |
| No stale data UX | Low | Medium |
