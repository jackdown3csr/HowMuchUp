# Architecture

**Analysis Date:** 2026-03-22

## Pattern Overview

**Overall:** Component-centric SPA (Single Page Application) with layered data flow: API → Chain → UI.

**Key Characteristics:**
- React frontend with minimal framework overhead
- Two isolated views: Leaderboard/Simulator (main) and gUBI Projection Lab (lab)
- Block-pinned on-chain data fetching for consistency
- Real-time simulations without backend state management
- Client-side calculation of reputation scores and rank projections

## Layers

**API Integration Layer:**
- Purpose: Fetch leaderboard rankings, user stats, pool data, and individual user details
- Location: `src/api.ts`
- Contains: Fetch functions with batch support, type-safe responses
- Depends on: External Galactica API, types
- Used by: App.tsx (main), Lab.tsx (optional)

**Chain Read Layer:**
- Purpose: Read contract state from Galactica blockchain via ethers.js
- Location: `src/chain.ts`
- Contains: Provider management, contract ABI definitions, lock data fetching with block pinning
- Depends on: ethers.js, contract addresses/ABIs, RPC endpoint
- Used by: App.tsx (enrichment), Lab.tsx (optional)

**Business Logic Layer:**
- Purpose: Pure mathematical calculations for simulations and projections
- Locations: `src/simulation.ts`, `src/lab.ts`, `src/utils.ts`
- Contains: Reputation calculations, rank computation, reward distribution math, gUBI projections
- Depends on: Constants (emission rates, time windows), utils
- Used by: App.tsx, Lab.tsx

**UI Component Layer:**
- Purpose: Render leaderboard tables, simulator controls, charts, and modals
- Locations: `src/App.tsx`, `src/Lab.tsx`
- Contains: React components, state management, event handlers, styling
- Depends on: All lower layers, i18n translations
- Used by: main.tsx

**Wallet Integration Layer:**
- Purpose: MetaMask connection and chain switching
- Location: `src/wallet.ts`
- Contains: Provider detection, account requests, chain validation
- Depends on: ethers.js type definitions, chain ID constant
- Used by: App.tsx

**Configuration Layer:**
- Purpose: Environment-specific values and contract definitions
- Location: `src/constants.ts`
- Contains: Chain ID, RPC URL, API base, contract addresses, ABIs, emission schedule, inflow schedule
- Depends on: Nothing
- Used by: All layers

**Internationalization Layer:**
- Purpose: Translate UI strings across two languages
- Location: `src/i18n.ts`
- Contains: English and French translations, function-based messages
- Depends on: Nothing
- Used by: App.tsx, Lab.tsx

## Data Flow

**Initial Load Flow:**

1. App.tsx mounts → calls `loadData()` on mount
2. Fetch leaderboard → fetch stats → fetch pool (parallel)
3. Extract addresses from leaderboard → fetch user details in batches (10 at a time)
4. Get current block number → fetch all lock data pinned to that block
5. Enrich leaderboard items with user data + lock data
6. Recalculate ranks by computed reputation
7. Distribute monthly emission based on reputation share
8. Set state: users, stats, pool, snapshotBlock, snapshotTs

**Simulation Flow:**

1. User selects address (or creates new wallet) → sets simAddress
2. User adjusts sliders: additionalGNET, extensionDays, extraSoul
3. Debounced (150ms) call to `simulate()` function
4. simulate() returns current/simulated metrics (locked, veGNET, reputation, rank, reward)
5. Comparison displayed: delta rank, delta reward

**Lab/Projection Flow:**

1. User clicks "Lab" tab
2. Lab.tsx loads selected user and pool participants
3. User adjusts projection parameters (frequency, soul score, horizon, growth %)
4. Call `projectGUBI()` with params
5. projectGUBI generates weekly data points with 3 scenarios (pessimistic, neutral, optimistic)
6. Charts render accumulating gUBI earned over time

**State Management:**

- Data state: users[], stats, pool, gubiSupply, snapshotBlock, snapshotTs (immutable after load)
- Simulator state: simAddress, additionalGNET, extensionDays, extraSoul, simResult (reactive)
- UI state: showPool, showHelp, showStats, showAllUsers, showAllCols, view, lang (local only)
- Wallet state: walletAddr, walletError (optional, persists selection)

## Key Abstractions

**EnrichedUser:**
- Purpose: Combines leaderboard rank + API user data + on-chain lock data into single source
- Examples: `src/App.tsx` line 172, type defined in `src/types.ts`
- Pattern: Enrichment happens once on load, users array passed by reference to child components

**SimulationResult:**
- Purpose: Encapsulates both current state and projected state with deltas
- Examples: `src/simulation.ts` line 54, type defined in `src/types.ts`
- Pattern: Computed reactively whenever simulator inputs change, passed to display components

**LabParams:**
- Purpose: Configuration for gUBI projection engine (starting conditions, contribution strategy, growth assumptions)
- Examples: `src/Lab.tsx` builds params, `src/lab.ts` consumes
- Pattern: Immutable structure passed to pure function `projectGUBI()`

**ProjectionPoint:**
- Purpose: One snapshot (week/month) in gUBI projection timeline
- Examples: `src/lab.ts` line 37, returned array from `projectGUBI()`
- Pattern: Array of points feeds directly to recharts LineChart

**LockData:**
- Purpose: On-chain state of a single user's voting escrow lock
- Examples: `src/chain.ts` line 31, fetched via `readLockData()` / `readLockDataBatch()`
- Pattern: Immutable snapshot at specific block height for consistency

## Entry Points

**main.tsx:**
- Location: `src/main.tsx`
- Triggers: Browser loads index.html
- Responsibilities: Render root App component into #root div with StrictMode + Vercel Analytics

**App.tsx:**
- Location: `src/App.tsx`
- Triggers: Mounted by main.tsx
- Responsibilities: Orchestrate data loading, manage all simulator state, render main UI (leaderboard + simulator) or delegate to Lab.tsx

**Lab.tsx:**
- Location: `src/Lab.tsx`
- Triggers: User clicks "Lab" button in App.tsx
- Responsibilities: Render gUBI projection controls, charts, scenario tables

## Error Handling

**Strategy:** Try-catch in async operations with user-facing error messages. Graceful degradation when optional data unavailable.

**Patterns:**
- API fetch errors: Caught in loadData(), displayed in error state, prevents simulator from running
- Chain read errors: Caught in readLockDataBatch(), partial failures handled via Promise.allSettled()
- MetaMask connection: Errors caught and displayed, continues with manual address entry
- Division by zero: Checked before reputation/rank calculations (veGNET < 1 → rep = 0, totalRep = 0 → share = 0)
- Invalid user selection: Simulated user falls back to null state, no simulation displayed

## Cross-Cutting Concerns

**Logging:** No structured logging. Console available for debugging via browser DevTools.

**Validation:**
- Address input: Case-insensitive matching (`.toLowerCase()`), checked against loaded user list
- Numeric ranges: Clamped at component level (extensionDays max 730, additionalGNET ≥ 0, etc.)
- Timestamp math: Unix seconds assumed throughout; conversion to days = divide by 86400

**Authentication:** MetaMask optional. Wallet address used only to auto-select user for simulation (no auth flow).

**Internationalization:** Lang state persists to localStorage, defaults to browser language preference, supports en/fr.

---

*Architecture analysis: 2026-03-22*
