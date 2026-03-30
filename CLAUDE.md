# HowMuchUp — CLAUDE.md

## Project Overview

Read-only Galactica leaderboard simulator. Shows how changes to locked GNET, lock duration, and SoulScore affect rank and monthly gUBI rewards. No write transactions.

**Stack:** React 19, TypeScript, Vite 8, ethers.js 6, Recharts, Vercel

## Commands

```bash
npm run dev       # start dev server
npm run build     # convert-og.js + tsc + vite build
npm run lint      # eslint
npm run preview   # preview production build
```

## Architecture

| File | Purpose |
|------|---------|
| `src/api.ts` | Galactica Admin API calls (leaderboard, user stats, pool data) |
| `src/chain.ts` | Block-pinned on-chain reads via ethers.js (VotingEscrow) |
| `src/simulation.ts` | Core simulation math (veGNET, reputation, rank, gUBI) |
| `src/types.ts` | Shared TypeScript types |
| `src/constants.ts` | Chain ID, RPC URL, API base, contract addresses, ABIs |
| `src/wallet.ts` | MetaMask connect + Galactica network switch |
| `src/i18n.ts` | Internationalisation strings |
| `src/utils.ts` | Utility helpers |
| `src/App.tsx` | Main app component (leaderboard + simulator panel) |
| `src/Lab.tsx` | Lab/pool projection modal |
| `src/lab.ts` | Lab computation logic |
| `scripts/convert-og.js` | Converts OG image SVG to PNG at build time (uses sharp) |

## Key Constants (`src/constants.ts`)

- **Chain:** Galactica Mainnet, chain ID `613419`
- **RPC:** `https://galactica-mainnet.g.alchemy.com/public`
- **API:** `https://admin-panel.galactica.com/api`
- **veGNET contract:** `0xdFbE5AC59027C6f38ac3E2eDF6292672A8eCffe4`
- **Monthly emission:** 5,000,000 gUBI

## Simulation Formula

```
vegnet_new = locked_new * (days_new / 730)
soul_new   = soul_current + extra_soul
rep_new    = soul_new * log10(max(vegnet_new, 1))
rank_new   = count(users where reputation > rep_new, excluding self) + 1
monthly    = (rep_new / adjusted_total_rep) * 5_000_000
```

Max lock is 730 days total (`days_left_current + extension_days` capped at 730).

## Deployment

Deployed on Vercel. `vercel.json` rewrites all non-`/api/` paths to `/index.html` (SPA routing). `@vercel/analytics` is included.

## Important Notes

- All on-chain reads use a single snapshot block for consistency.
- Wallet connect is only for address selection convenience — no signing.
- `public/og-image.png` is generated from `public/og-image.svg` at build time via `scripts/convert-og.js`.

---

## Working Rules

### Core Principles

**Simplicity First** — make every change as simple as possible and minimize code impact.

**No Laziness** — find root causes, avoid temporary fixes, maintain senior-level engineering standards.

### Planning

- Enter plan mode for any non-trivial task (3+ steps or architectural decisions).
- Write detailed specs upfront to reduce ambiguity.
- If something goes wrong, STOP and re-plan immediately — don't keep pushing.
- Use plan mode for verification steps, not just building.

### Task Management

1. **Plan first** — write the plan in `tasks/todo.md` with checkable items.
2. **Verify plan** — confirm approach before implementation.
3. **Track progress** — mark items complete as you go.
4. **Explain changes** — provide a high-level summary at each step.
5. **Document results** — add a review section to `tasks/todo.md`.
6. **Capture lessons** — update `tasks/lessons.md` after any correction.

### Subagent Strategy

- Use subagents frequently to keep the main context window clean.
- Offload research, exploration, and parallel analysis to subagents.
- Assign one focused task per subagent.
- For complex problems, use more subagents in parallel.

### Verification

- Never mark a task complete without proving it works.
- Diff behavior between main and your changes when relevant.
- Ask: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness.

### Elegance (Balanced)

- For non-trivial changes, ask: "Is there a more elegant solution?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution."
- Skip this for simple fixes — don't over-engineer.

### Bug Fixing

- When given a bug report: just fix it.
- Use logs, errors, and failing tests to diagnose.
- Fix failing CI tests automatically.
- Require zero context switching from the user.

### Self-Improvement

- After any correction, update `tasks/lessons.md` with the pattern.
- Write rules to prevent repeating the same mistake.
- Review lessons at the start of each session.
