# TESTING.md — Test Structure & Practices

## Current State

**No test framework is configured. Zero test coverage.**

There are no test files, no test runner, and no test-related scripts in `package.json`. TypeScript strict mode is the only automated safety mechanism in place.

## What Exists

| Mechanism | Status |
|-----------|--------|
| Unit tests | None |
| Integration tests | None |
| E2E tests | None |
| TypeScript strict mode | ✅ Active |
| ESLint | ✅ Active |

## High-Priority Areas for Testing

Based on codebase analysis, these modules carry the most risk with no test coverage:

### 1. `src/simulation.ts` — Scoring Engine
- Rank calculation math is complex and domain-specific
- Bugs here silently corrupt the entire leaderboard display
- Pure functions — easy to unit test

### 2. `src/chain.ts` — Chain Data Parsing
- Lock amount parsing, veGNET decay calculations
- Edge cases: expired locks, zero amounts, malformed data
- Pure functions — easy to unit test

### 3. `src/utils.ts` — Formatting & Transforms
- Number formatting, sorting, data transforms used everywhere
- Many small pure functions — ideal for snapshot/property tests

### 4. `src/lab.ts` — gUBI Projection Math
- Pool decay curves, accumulation calculations
- Numerical precision matters — property tests recommended

### 5. `src/api.ts` — Batch Fetching
- Pagination logic, `Promise.allSettled` error handling
- RPC failure scenarios have no test coverage

## Recommended Test Stack

```json
{
  "devDependencies": {
    "vitest": "^2.x",
    "@testing-library/react": "^16.x",
    "@testing-library/user-event": "^14.x",
    "jsdom": "^25.x"
  }
}
```

**Why Vitest:** Native Vite integration, same config, fast, TypeScript-first.

## Suggested `vite.config.ts` Addition

```ts
test: {
  environment: 'jsdom',
  globals: true,
  include: ['src/**/*.{test,spec}.ts'],
}
```

## Suggested `package.json` Scripts

```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

## Testing Patterns to Follow

Given the flat module structure, tests should mirror it:

```
src/
├── simulation.test.ts
├── chain.test.ts
├── utils.test.ts
├── lab.test.ts
└── api.test.ts
```

Pure logic modules (`simulation.ts`, `chain.ts`, `utils.ts`, `lab.ts`) need only unit tests. `api.ts` needs mocked RPC responses. React components (`App.tsx`, `Lab.tsx`) can be tested with React Testing Library for critical user interactions.
