# HowMuchUp

HowMuchUp is a read-only Galactica leaderboard simulator for exploring how lock changes affect rank, reputation, and monthly gUBI rewards.

It combines Galactica API data with block-pinned on-chain reads so the displayed leaderboard and the simulator are computed from one consistent snapshot.

## What It Does

- Loads the current Galactica leaderboard.
- Reads on-chain lock state and veGNET balances from VotingEscrow.
- Recomputes reputation from SoulScore and veGNET.
- Simulates additional locked GNET, extra lock duration, and extra SoulScore.
- Re-ranks the selected wallet across the full leaderboard in real time.
- Estimates the resulting monthly gUBI allocation.

## Features

- Read-only app, no transaction signing.
- MetaMask connect for quick wallet selection.
- Automatic Galactica network switch when connecting.
- Block-consistent on-chain reads using a single snapshot block.
- Sticky simulator panel alongside the leaderboard.
- Pool backing projection in a modal.
- Responsive mobile layout.

## Stack

- Vite
- React
- TypeScript
- ethers.js

## Data Sources

- Galactica Admin API: leaderboard, user stats, pool data
- Galactica Mainnet RPC: VotingEscrow lock data and veGNET balances

## Core Simulation Inputs

- Additional GNET lock amount
- Additional lock days, capped at the maximum allowed 730 days total
- Additional SoulScore

## Simulation Logic

For simulated values:

- `locked_new = locked_current + additional_gnet`
- `days_new = min(days_left_current + extension_days, 730)`
- `vegnet_new = locked_new * (days_new / 730)`
- `soul_new = soul_current + extra_soul`
- `rep_new = soul_new * log10(max(vegnet_new, 1))`
- `rank_new = count(users where reputation > rep_new, excluding self) + 1`
- `monthly_new = (rep_new / adjusted_total_rep) * 5_000_000`

The current leaderboard itself is loaded from a block-pinned snapshot so all on-chain reads line up.

## Notes

- The app is designed for exploration, not execution.
- Connecting a wallet only helps select an address faster.
- No write actions are sent to the chain.

## Roadmap Ideas

- Sharable simulation URLs
- Scenario compare mode
- Export selected wallet simulation as image
- Historical snapshots by block or date


