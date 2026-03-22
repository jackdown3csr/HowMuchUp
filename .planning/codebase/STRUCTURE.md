# STRUCTURE.md — Directory Layout & Organization

## Root Layout

```
leaderboard2/
├── src/                  # All application source code (flat, no subdirs)
├── public/               # Static assets served as-is
├── dist/                 # Built output (Vite)
├── .planning/            # GSD planning artifacts
├── index.html            # Vite entry HTML
├── package.json
├── vite.config.ts
├── tsconfig.json         # Project references root
├── tsconfig.app.json     # App TypeScript config
├── tsconfig.node.json    # Node/tooling TypeScript config
├── eslint.config.js
├── GALACTICA_REFERENCE.md
└── README.md
```

## src/ — Flat Module Structure

All source files live directly in `src/` with no subdirectories.

```
src/
├── main.tsx          # React entry point — mounts <App />
├── App.tsx           # Root component — tabs, routing, all state
├── App.css           # Global + component styles
├── index.css         # CSS reset / base styles
├── Lab.tsx           # Lab/projection tab — recharts-based UI
├── types.ts          # All shared TypeScript interfaces & types
├── api.ts            # Blockchain data fetching (RPC calls, batching)
├── chain.ts          # Chain-level utilities (lock parsing, veGNET calc)
├── simulation.ts     # Scoring/simulation engine (rank math)
├── lab.ts            # gUBI projection math logic
├── utils.ts          # General helpers (formatting, sorting, transforms)
├── wallet.ts         # Wallet connection (wagmi/viem)
├── constants.ts      # App-wide constants (endpoints, params)
├── i18n.ts           # Internationalisation (en/cs translations)
└── assets/           # Images and SVGs
    ├── hero.png
    ├── react.svg
    └── vite.svg
```

## public/ — Static Assets

```
public/
├── favicon.svg
└── icons.svg         # Icon sprite used throughout UI
```

## Key File Responsibilities

| File | Role |
|------|------|
| `src/App.tsx` | God component — owns all data fetching state, tab switching, leaderboard rendering |
| `src/types.ts` | Single source of truth for `EnrichedUser`, `SimulationResult`, `LockData`, `LabParams`, `ProjectionPoint` |
| `src/api.ts` | All RPC/REST calls — batch fetching, pagination, retry logic |
| `src/chain.ts` | Low-level chain data parsing — lock amounts, veGNET, decay |
| `src/simulation.ts` | Pure scoring math — converts chain data to ranked leaderboard entries |
| `src/lab.ts` | gUBI projection calculations, pool decay curves |
| `src/Lab.tsx` | Recharts-based projection UI, standalone tab component |
| `src/wallet.ts` | wagmi wallet state, connect/disconnect |
| `src/constants.ts` | RPC endpoints, contract addresses, pagination sizes |
| `src/i18n.ts` | `t()` translation function, language detection |

## Naming Conventions

- **Components**: PascalCase files (`App.tsx`, `Lab.tsx`)
- **Logic modules**: camelCase files (`api.ts`, `chain.ts`, `simulation.ts`)
- **Styles**: Co-located with component (`App.css` next to `App.tsx`)
- **Types**: All in `types.ts` — no per-module type files
- **Constants**: All in `constants.ts`

## Architecture Notes

- **No subdirectory nesting** — everything flat in `src/`
- **No component library subdirectory** — components are inlined in `App.tsx` or `Lab.tsx`
- **No routing library** — tab state managed manually in `App.tsx`
- **No state management library** — React `useState`/`useEffect` only
- **Single CSS file** (`App.css`) handles most styling with some inline styles
