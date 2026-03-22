# Technology Stack

**Analysis Date:** 2026-03-22

## Languages

**Primary:**
- TypeScript ~5.9.3 - All source code including React components and chain interactions
- TSX/JSX - React component syntax in `src/App.tsx` and `src/Lab.tsx`

**Secondary:**
- JavaScript - ESLint configuration in `eslint.config.js`
- CSS - Inline styles throughout components (dark theme palette defined in `src/App.tsx`)
- HTML - Single-page entry point in `index.html`

## Runtime

**Environment:**
- Node.js (version managed via local config)

**Package Manager:**
- npm (with `package-lock.json` committed)

## Frameworks

**Core:**
- React 19.2.4 - UI framework
  - React DOM 19.2.4 - DOM rendering
  - React Hooks - State management (useState, useEffect, useCallback, useMemo, useRef used throughout)

**Blockchain:**
- ethers 6.16.0 - Ethereum interaction, contract reading, provider connections
  - Used for JSON-RPC provider in `src/chain.ts`
  - Contract interaction for veGNET and ERC-20 tokens
  - Wallet connection with MetaMask provider in `src/wallet.ts`

**Charting/Visualization:**
- recharts 3.8.0 - Data visualization for Lab component projections in `src/Lab.tsx`

**Build/Dev:**
- Vite 8.0.0 - Build tool and dev server
  - @vitejs/plugin-react 6.0.0 - React JSX transform plugin
  - TypeScript compilation via tsc

**Linting/Quality:**
- ESLint 9.39.4 - Code quality
  - @eslint/js 9.39.4 - Base ESLint rules
  - typescript-eslint 8.56.1 - TypeScript-specific rules
  - eslint-plugin-react-hooks 7.0.1 - React hooks linting
  - eslint-plugin-react-refresh 0.5.2 - React Fast Refresh compatibility

**Analytics:**
- @vercel/analytics 2.0.1 - Analytics integration in `src/main.tsx`

## Key Dependencies

**Critical:**
- ethers 6.16.0 - Blockchain provider and contract interaction, core to on-chain reads
- React 19.2.4 - UI framework, core runtime

**Infrastructure:**
- recharts 3.8.0 - Data visualization for Lab pool projections
- @vercel/analytics 2.0.1 - Analytics tracking integration

## Configuration

**Environment:**
- TypeScript strict mode enabled
- Target: ES2023
- Module resolution: bundler
- No external environment variables detected for configuration

**Build:**
- `tsconfig.json` - Root TypeScript configuration with references to app and node configs
- `tsconfig.app.json` - App-specific compilation (ES2023, DOM, JSX)
- `tsconfig.node.json` - Build tool TypeScript (ES2023, Node types)
- `vite.config.ts` - Vite build configuration with React plugin
- `eslint.config.js` - Flat ESLint config targeting `.ts` and `.tsx` files
- `package.json` - Build scripts: `dev` (Vite dev), `build` (tsc -b && vite build), `lint` (ESLint), `preview`

## Platform Requirements

**Development:**
- Node.js runtime
- npm for dependency management
- Modern browser with ES2023 support

**Production:**
- Static file hosting (Vite SPA)
- Browser with ES2023 JavaScript support
- No server-side runtime required

---

*Stack analysis: 2026-03-22*
