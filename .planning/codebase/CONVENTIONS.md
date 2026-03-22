# Coding Conventions

**Analysis Date:** 2026-03-22

## Naming Patterns

**Files:**
- TypeScript files use camelCase: `api.ts`, `chain.ts`, `utils.ts`, `simulation.ts`
- React components use PascalCase: `App.tsx`, `Lab.tsx`
- Utility/helper files use descriptive camelCase names

**Functions:**
- Use camelCase for all functions: `parseVeGNET()`, `fetchAllLeaderboard()`, `readLockData()`
- Async functions follow the same pattern: `fetchUser()`, `connectMetaMask()`
- Prefix type/validation functions with `is` or `calc`: `isMetaMaskInstalled()`, `calcVeGNET()`, `calcReputation()`
- Helper functions may be prefixed with verbs: `computePoolProjection()`, `roundToWeek()`

**Variables:**
- camelCase for all variables and constants in functions
- Constants that are module-level use UPPERCASE_SNAKE_CASE: `CHAIN_ID`, `MONTHLY_EMISSION`, `INFLOW_SCHEDULE`, `WEEK`
- Boolean variables may use `is`/`has` prefix: `hasChanges`, `isMetaMaskInstalled()`
- Private module state uses underscore prefix: `_provider` (in `chain.ts`)

**Types & Interfaces:**
- PascalCase for all interface names: `LeaderboardItem`, `EnrichedUser`, `SimulationResult`
- Describe the structure (noun-based): `UserData`, `StatsData`, `PoolData`
- Type definition files are grouped logically in `types.ts`

## Code Style

**Formatting:**
- ESLint with TypeScript support via `typescript-eslint`
- No explicit Prettier config detected - uses ESLint defaults
- 2-space indentation (inferred from codebase)
- No semicolon enforcement visible, but codebase uses semicolons consistently

**Linting:**
- ESLint configuration: `eslint.config.js` (flat config format)
- Plugins:
  - `eslint-plugin-react-hooks` - enforces Hook rules
  - `eslint-plugin-react-refresh` - ensures exports for Vite Fast Refresh
  - `typescript-eslint` - TypeScript-aware linting
- Extends recommended configs from all plugins
- Global ignore: `/dist`

**TypeScript Settings (tsconfig.app.json):**
- Target: `ES2023`
- `strict: true` - enables all type checking strictness
- `noUnusedLocals: false` - allows unused variables (not enforced)
- `noUnusedParameters: false` - allows unused parameters
- `noFallthroughCasesInSwitch: true` - prevents accidental case fallthrough
- JSX preset: `react-jsx` (automatic JSX transform)
- No path aliases configured (direct relative imports)

## Import Organization

**Order:**
1. React/standard library imports: `import { useState } from "react"`
2. Type imports: `import type { LeaderboardItem, ... } from "./types"`
3. Local module imports: `import { fetchAllLeaderboard } from "./api"`
4. Conditional/dynamic imports (rare in codebase)

**Path Aliases:**
- None configured. All imports use relative paths: `"./types"`, `"./api"`, `"./constants"`

**Barrel Files:**
- Not used. Each module exports its functions directly.

## Error Handling

**Patterns Observed:**

1. **Try-catch blocks for API and JSON parsing:**
   ```typescript
   try {
     const obj = JSON.parse(raw);
     const vals = Object.values(obj) as string[];
     return parseFloat(vals[0]) || 0;
   } catch {
     return 0;  // Silent failure with fallback default
   }
   ```

2. **Throw on critical errors:**
   ```typescript
   if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
   ```

3. **Promise.allSettled for batch operations:**
   ```typescript
   const results = await Promise.allSettled(batch.map((a) => fetchUser(a)));
   results.forEach((r, idx) => {
     if (r.status === "fulfilled") {
       map.set(batch[idx].toLowerCase(), r.value);
     }
   });
   ```
   Non-throwing aggregation of failures.

4. **Graceful null returns:**
   - Functions return `null` on wallet connection failure: `connectMetaMask(): Promise<string | null>`
   - Functions return default values on parse errors: `parseVeGNET()` returns `0`

**Error Handling Strategy:**
- Silent fallbacks for optional data (parse errors, missing fields)
- Throws for critical path failures (API errors, missing wallet)
- User-facing errors stored in state: `error`, `walletError`

## Logging

**Framework:** `console` only

**Patterns:**
- No structured logging observed
- Error messages displayed via UI state, not logged: `setError()`, `setWalletError()`
- Progress updates via state: `setLoadProgress()`
- No log levels, timestamps, or debug modes

## Comments

**When to Comment:**
- JSDoc-style comments for public functions describing parameters and return values
- Inline comments explaining complex calculations or non-obvious logic
- Section separators using `// --- Label ---` format

**JSDoc/TSDoc Usage:**
```typescript
/**
 * Parse the veGNET JSON string from /user API.
 * Format: {"0xdfbe...":"44235.89"} — take the first value.
 */
export function parseVeGNET(raw: string): number {
  // ...
}
```

Comments are minimal but present for complex domain logic and API contracts.

## Function Design

**Size:**
- Small utility functions: 5-15 lines
- Medium logic functions: 20-40 lines
- Complex functions like `projectGUBI()` can exceed 100 lines when they encapsulate distinct phases

**Parameters:**
- Keep parameter lists short (< 5 for most functions)
- Use explicit typing with `type` imports
- Group related parameters: batching functions take `addresses[]` and `batchSize`

**Return Values:**
- Functions return typed values or null
- Async functions return `Promise<T>`
- Batch functions return `Map<string, T>` for easy lookups
- Validation/parse functions return sensible defaults on failure

**Error Handling in Function Signatures:**
- Distinguish nullable returns: `Promise<string | null>` means intentional failure case
- Use throw for unexpected errors

## Module Design

**Exports:**
- All exports are named exports (e.g., `export function`, `export interface`)
- No default exports in `.ts` files
- React components use default export: `export default App`
- Type-only exports using `export type`: `export type Lang = "en" | "fr"`

**Module Responsibilities:**
- `api.ts` - all REST API fetch functions
- `chain.ts` - ethers.js contract reads and state management
- `types.ts` - all TypeScript interfaces and domain types
- `utils.ts` - pure utility functions (formatting, math, conversions)
- `constants.ts` - configuration, contract ABIs, schedules
- `simulation.ts` - business logic for rank/reward simulation
- `lab.ts` - gUBI projection engine
- `wallet.ts` - MetaMask integration
- `App.tsx`, `Lab.tsx` - React components
- `i18n.ts` - translations (large file, 21.3K)

**Separation of Concerns:**
- UI logic separated from business logic
- API/chain reads isolated in dedicated modules
- Constants and types kept separate from implementation

## Linting Overrides

**Usage:**
- `eslint-disable-next-line no-constant-condition` - for intentional `while (true)` loops
- `eslint-disable-next-line react-hooks/exhaustive-deps` - for intentional hook dependency omissions

Overrides are minimal (2 instances found) and used only when truly justified.

## React-Specific Patterns

**Hooks Usage:**
- `useState` for local state
- `useCallback` for memoized event handlers
- `useMemo` for expensive computations
- `useEffect` for side effects and data loading
- `useRef` for persistent values across renders

**Component Structure:**
- Large components like `App.tsx` (39.2K) handle multiple concerns (state, data fetching, UI)
- Inline style objects for component-specific styling
- Props passed directly without prop interfaces (informal)

---

*Convention analysis: 2026-03-22*
