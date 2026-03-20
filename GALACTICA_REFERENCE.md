# Galactica Chain & API Reference

Complete reference for all Galactica network details, smart contracts, REST API endpoints, on-chain reads, data types, and core formulas used in this codebase.

---

## 1. Network

| Property | Value |
|---|---|
| Name | Galactica Mainnet |
| Chain ID | `613419` |
| RPC URL | `https://galactica-mainnet.g.alchemy.com/public` |
| Block Explorer | `https://explorer.galactica.com` |
| Native Currency | GNET (18 decimals) |

**MetaMask wallet_addEthereumChain params** (used in `wallet.ts`):
```json
{
  "chainId": "0x95CCB",
  "chainName": "Galactica Mainnet",
  "nativeCurrency": { "name": "GNET", "symbol": "GNET", "decimals": 18 },
  "rpcUrls": ["https://galactica-mainnet.g.alchemy.com/public"],
  "blockExplorerUrls": ["https://explorer.galactica.com"]
}
```

---

## 2. Smart Contracts

| Name | Address |
|---|---|
| **veGNET** (VotingEscrow) | `0xdFbE5AC59027C6f38ac3E2eDF6292672A8eCffe4` |
| **gUBI Token** (ERC-20) | `0xFEa4F549eFB1F8B2cBA8d029e6845Ee431e142AA` |
| **gUBI Pool** | `0x50AF2AAb1455C1C06B3b8e623549dDE437F54EeF` |
| **WGNET** (Wrapped GNET) | `0x690F1eEf8AcEaD09Ac695d9111Af081045c6d5b7` |
| **Archai** | `0x22b48a764d2aAAe14d751aD2B5fcdf6C0A4d95D7` |

### VotingEscrow ABI (veGNET)

```solidity
function locked(address) view returns (uint256)
function lockEnd(address) view returns (uint256)
function balanceOf(address) view returns (uint256)
function MAXTIME() view returns (uint256)
```

- `locked(addr)` — raw amount of GNET locked (18-decimal uint, divide by 1e18 for GNET)
- `lockEnd(addr)` — Unix timestamp when the lock expires
- `balanceOf(addr)` — current veGNET voting power (decays linearly to 0 at lockEnd)
- `MAXTIME()` — maximum lock duration in seconds (730 days = 63,072,000 s)

### ERC-20 ABI (gUBI Token)

```solidity
function totalSupply() view returns (uint256)
function balanceOf(address) view returns (uint256)
```

---

## 3. REST API

**Base URL:** `https://admin-panel.galactica.com/api`

Every request appends `?chainId=613419` (or `&chainId=613419` if the path already has query params).

### GET `/leaderboard`

Returns a paginated leaderboard.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `offset` | number | Pagination offset (default 0) |
| `limit` | number | Page size (max 100) |
| `chainId` | number | Must be `613419` |

**Response:** `LeaderboardResponse`

```ts
interface LeaderboardResponse {
  items: LeaderboardItem[];
  total: number;          // total number of users in the leaderboard
}

interface LeaderboardItem {
  address: string;        // checksummed 0x address
  rank: number;           // API-assigned rank (app re-ranks client-side)
  points: number;         // SoulScore
  reputation: number;     // API reputation (app recomputes locally)
  gubiAccrued: number;    // gUBI accrued (informational)
  pool: string;
}
```

**Fetching strategy:** paginated loop of 100 items, continues until `all.length >= total` (`api.ts → fetchAllLeaderboard`).

---

### GET `/user/:address`

Returns detailed data for a single wallet.

**Path params:**

| Param | Description |
|---|---|
| `address` | Wallet address (any case) |

**Query params:** `chainId=613419`

**Response:** `UserData`

```ts
interface UserData {
  rank: number;
  points: number;           // SoulScore (same as leaderboard `points`)
  soulScore: number;        // alias for points in some contexts
  reputation: number;       // API-computed reputation
  veGNET: string;           // JSON string, e.g. {"0xdfbe...":"44235.89"}
  share: number;            // fraction of monthly emission this user receives
  monthlyReward: number;    // estimated monthly gUBI reward
  totalEarnings: number;    // cumulative gUBI earned
  alreadyClaimed: number;   // gUBI already claimed
}
```

> **Note:** `veGNET` is a JSON string mapping the veGNET contract address to the user's balance. Parse it with `parseVeGNET()` in `utils.ts` — take `Object.values(obj)[0]` and `parseFloat`.

Fetched in parallel batches of 10 via `fetchUsersInBatches()` in `api.ts`.

---

### GET `/stats`

Global protocol statistics.

**Query params:** `chainId=613419`

**Response:** `StatsData`

```ts
interface StatsData {
  totalReputation: number;       // sum of all users' reputation
  totalMonthlyEmission: number;  // gUBI emitted per month
  emissionPerRepPoint: number;   // gUBI / rep point
  totalUsers: number;
}
```

---

### GET `/pool`

gUBI pool composition and pricing.

**Query params:** `chainId=613419`

**Response:** `PoolData`

```ts
interface PoolData {
  totalWorthUSD: number;
  gubiPrice: number;
  supply: number;             // current gUBI token supply
  composition: Array<{
    address: string;          // token contract address
    symbol: string;           // e.g. "WGNET", "GUBI"
    balance: number;
    priceUSD: number;
    valueUSD: number;
  }>;
}
```

---

## 4. On-Chain Reads (`chain.ts`)

All reads use an `ethers.JsonRpcProvider` connected to the RPC above. A singleton provider is lazily created by `getProvider()`.

| Function | Returns | Description |
|---|---|---|
| `getProvider()` | `JsonRpcProvider` | Singleton provider for Galactica Mainnet |
| `getCurrentBlock()` | `number` | Current block number |
| `readMaxTime()` | `number` | `MAXTIME()` from VotingEscrow (seconds) |
| `readLockData(address, blockTag?)` | `LockData` | Lock state for one address |
| `readLockDataBatch(addresses, batchSize?, blockTag?)` | `Map<string, LockData>` | Batch lock reads, 10 at a time |
| `readGubiTotalSupply()` | `number` | gUBI ERC-20 total supply |

**LockData shape:**

```ts
interface LockData {
  locked: number;       // GNET locked (ether units, already divided by 1e18)
  lockEnd: number;      // Unix timestamp of lock expiry
  balanceOf: number;    // veGNET balance at read time (ether units)
}
```

**Block-pinning:** all lock reads in the app are pinned to a single snapshot block (`readLockDataBatch(addresses, 10, blockNum)`) so every user's data is consistent.

---

## 5. Core Formulas

### veGNET (voting power)

```
veGNET = lockedGNET × (daysRemaining / 730)
```

- `daysRemaining` = `(lockEnd − now) / 86400`
- Capped at 730 days (2 years)
- Decays linearly to 0 at `lockEnd`
- Lock end timestamps are rounded down to the nearest week boundary (`Math.floor(ts / (7×86400)) × (7×86400)`)

### Reputation

```
reputation = soulScore × log₁₀(veGNET)     if veGNET ≥ 1
reputation = 0                               if veGNET < 1
```

### Monthly gUBI Reward

```
monthlyReward = (reputation / totalReputation) × MONTHLY_EMISSION
```

- `MONTHLY_EMISSION = 5,000,000` gUBI/month (constant in `constants.ts`)
- `totalReputation` = sum of all users' reputations

### Rank

Users are sorted by `reputation` descending; rank is 1-based index.

---

## 6. GNET Inflow Schedule (`constants.ts`)

Scheduled GNET unlocks flowing into the gUBI pool, used for the pool backing projection in the app UI.

| Period | GNET Inflow |
|---|---|
| Initial Unlock | 876,142 |
| October 2025 | 897,407 |
| November 2025 | 1,151,748 |
| December 2025 | 1,152,000 |
| January 2026 | 1,152,000 |
| February 2026 | 5,466,677 |
| March 2026 | 3,974,677 |
| April 2026 – January 2028 | 3,974,677 / month |

**Pool backing projection formula:**

```
projectedWorth = pool.totalWorthUSD + cumulativeGNET × gnetPriceUSD
backingPerGubi = projectedWorth / gubiSupply
```

`gnetPriceUSD` is taken from the pool composition entry where `symbol === "WGNET"` or `"GNET"`.

---

## 7. Data Flow Summary

```
1. fetchAllLeaderboard()       → LeaderboardItem[]   (paginated, up to 100/req)
2. fetchStats()                → StatsData
3. fetchPool()                 → PoolData
4. fetchUsersInBatches()       → Map<addr, UserData>  (10 req in parallel)
5. getCurrentBlock()           → snapshot block
6. readGubiTotalSupply()       → gUBI supply (on-chain)
7. readLockDataBatch(addrs, 10, snapshotBlock)
                               → Map<addr, LockData>  (block-pinned)

Enrich each user:
  soulScore   = UserData.points
  veGNET      = LockData.balanceOf         (on-chain, decays per second)
  reputation  = soulScore × log₁₀(veGNET) (if veGNET ≥ 1, else 0)

Re-rank by computed reputation (descending, 1-based).

Recompute monthlyReward:
  totalRep = Σ reputation
  monthlyReward[u] = (reputation[u] / totalRep) × 5_000_000
```

---

## 8. Key Constants

| Constant | Value | Source |
|---|---|---|
| `CHAIN_ID` | `613419` | `constants.ts` |
| `RPC_URL` | `https://galactica-mainnet.g.alchemy.com/public` | `constants.ts` |
| `API_BASE` | `https://admin-panel.galactica.com/api` | `constants.ts` |
| `MONTHLY_EMISSION` | `5,000,000` | `constants.ts` |
| Max lock (MAXTIME) | 730 days | VotingEscrow contract |
| Week boundary | 7 × 86400 s | `utils.ts → roundToWeek` |
