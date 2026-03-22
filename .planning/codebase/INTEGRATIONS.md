# External Integrations

**Analysis Date:** 2026-03-22

## APIs & External Services

**Galactica Ecosystem:**
- Admin Panel API - Leaderboard and user data source
  - SDK/Client: Native fetch (browser Fetch API in `src/api.ts`)
  - Base URL: `https://admin-panel.galactica.com/api`
  - Endpoints: `/leaderboard`, `/user/{address}`, `/stats`, `/pool`
  - Auth: None (public endpoints, chainId parameter required)

**Blockchain Node:**
- Alchemy Galactica Mainnet RPC
  - SDK/Client: ethers.JsonRpcProvider in `src/chain.ts`
  - URL: `https://galactica-mainnet.g.alchemy.com/public`
  - Purpose: Block-pinned on-chain reads, contract interaction

**External Integration:**
- Flambeur (promotional)
  - External link in `src/App.tsx` pointing to `https://flambeur.xyz`

## Data Storage

**Databases:**
- None - Pure frontend application

**File Storage:**
- Browser localStorage
  - Stores selected language preference (`"lang"` key) in `src/App.tsx`
  - Persists UI state across sessions

**Caching:**
- None - Data fetched on-demand, cached in React component state

## Authentication & Identity

**Auth Provider:**
- MetaMask/Browser Wallet (via EIP-1193 provider in `src/wallet.ts`)
  - Implementation: Direct MetaMask integration using window.ethereum
  - Features:
    - Account connection via `eth_requestAccounts`
    - Chain verification via `eth_chainId`
    - Automatic chain addition (Galactica Mainnet) if not installed
    - No backend authentication required

**Wallet Requirements:**
- Chain ID: 613419 (Galactica Mainnet)
- Native currency: GNET
- Block explorer: `https://explorer.galactica.com`

## Smart Contracts

**On-Chain Reads:**
- veGNET Contract: `0xdFbE5AC59027C6f38ac3E2eDF6292672A8eCffe4`
  - Methods: `locked(address)`, `lockEnd(address)`, `balanceOf(address)`, `MAXTIME()`
  - ABI defined in `src/constants.ts`
  - Used in `src/chain.ts` for lock data queries

- gUBI Token: `0xFEa4F549eFB1F8B2cBA8d029e6845Ee431e142AA`
  - Methods: `totalSupply()`, `balanceOf(address)`
  - ERC-20 compliant
  - Used in `src/chain.ts` for supply reads

- gUBI Pool: `0x50AF2AAb1455C1C06B3b8e623549dDE437F54EeF`
  - Referenced in `src/constants.ts` (read-only)

- Wrapped GNET: `0x690F1eEf8AcEaD09Ac695d9111Af081045c6d5b7`
  - Referenced in `src/constants.ts` for pool composition

- Archai: `0x22b48a764d2aAAe14d751aD2B5fcdf6C0A4d95D7`
  - Referenced in `src/constants.ts` for pool composition

## Monitoring & Observability

**Error Tracking:**
- Not detected

**Logs:**
- Browser console (no structured logging framework detected)

**Analytics:**
- Vercel Analytics
  - Package: @vercel/analytics 2.0.1
  - Integration: `<Analytics />` component in `src/main.tsx`
  - Purpose: Frontend usage tracking

## CI/CD & Deployment

**Hosting:**
- Not specified in codebase (built as static SPA via Vite)

**CI Pipeline:**
- Not detected

## Environment Configuration

**Runtime Environment Variables:**
- None required - All configuration hardcoded in `src/constants.ts`:
  - `CHAIN_ID = 613419`
  - `RPC_URL = "https://galactica-mainnet.g.alchemy.com/public"`
  - `API_BASE = "https://admin-panel.galactica.com/api"`

**Secrets Location:**
- None used - Public endpoints only

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## Data Flow

**Leaderboard View:**
1. User loads app → `src/main.tsx`
2. Component fetches via `fetchAllLeaderboard()` → `https://admin-panel.galactica.com/api/leaderboard`
3. On-chain data reads via `readLockDataBatch()` → RPC `https://galactica-mainnet.g.alchemy.com/public`
4. Display enriched leaderboard in `src/App.tsx`

**User Simulation:**
1. User connects MetaMask wallet via `connectMetaMask()` in `src/wallet.ts`
2. MetaMask validates chain ID 613419
3. Fetch user-specific data via `fetchUser(address)` → API
4. Fetch lock data via `readLockData(address, blockTag)` → RPC
5. Run simulation in `src/simulation.ts`
6. Display results and projections

**Lab (gUBI Projections):**
1. Fetch pool data via `fetchPool()` → API
2. Fetch gUBI supply via `readGubiTotalSupply()` → RPC
3. Project pool backing per gUBI using `INFLOW_SCHEDULE` in `src/constants.ts`
4. Render chart in `src/Lab.tsx` using recharts

---

*Integration audit: 2026-03-22*
