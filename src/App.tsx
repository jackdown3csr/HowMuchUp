import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { EnrichedUser, PoolData, StatsData, SimulationResult } from "./types";
import { fetchAllLeaderboard, fetchUsersInBatches, fetchStats, fetchPool } from "./api";
import { readLockDataBatch, readMaxTime, readGubiTotalSupply, getCurrentBlock } from "./chain";
import { shortAddr, formatNumber, formatDate, calcReputation } from "./utils";
import { MONTHLY_EMISSION, INFLOW_SCHEDULE } from "./constants";
import { simulate } from "./simulation";
import { isMetaMaskInstalled, connectMetaMask } from "./wallet";
import { translations } from "./i18n";
import type { Lang } from "./i18n";
import Lab from "./Lab.tsx";

const NEW_WALLET = "__new__";

// --- Dark theme palette ---
const C = {
  bg: "#0e0e0e",
  surface: "#181818",
  border: "#2a2a2a",
  borderAccent: "#3a3a3a",
  text: "#d4d4d4",
  textBright: "#f0f0f0",
  textDim: "#777",
  muted: "#666",
  accent: "#4af",
  highlight: "#1e2a1e",
  highlightRow: "#1c1c1c",
  red: "#f55",
  green: "#4c4",
  orange: "#fa0",
};

const th: React.CSSProperties = {
  border: `1px solid ${C.border}`,
  padding: "3px 8px",
  background: "#1e1e1e",
  textAlign: "left",
  whiteSpace: "nowrap",
  color: C.textDim,
  fontWeight: "normal",
  fontSize: 11,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};
const td: React.CSSProperties = {
  border: `1px solid ${C.border}`,
  padding: "3px 8px",
  whiteSpace: "nowrap",
  color: C.text,
};
const tdRight: React.CSSProperties = { ...td, textAlign: "right" };
const card: React.CSSProperties = {
  marginBottom: 12,
  padding: "10px 14px",
  border: `1px solid ${C.border}`,
  background: C.surface,
  borderRadius: 4,
};
const inputStyle: React.CSSProperties = {
  background: "#111",
  border: `1px solid ${C.borderAccent}`,
  color: C.text,
  padding: "3px 6px",
  fontFamily: "monospace",
  fontSize: 13,
  borderRadius: 3,
};
const btnStyle: React.CSSProperties = {
  background: "#1a2a3a",
  border: `1px solid ${C.accent}`,
  color: C.accent,
  padding: "4px 12px",
  fontFamily: "monospace",
  fontSize: 13,
  cursor: "pointer",
  borderRadius: 3,
};

// --- Pool projection helper ---
function computePoolProjection(
  pool: PoolData | null,
  gubiSupply: number,
): { label: string; inflow: number; cumulative: number; backingPerGubi: number }[] {
  if (!pool) return [];
  const gnetComp = pool.composition.find(
    (c) => c.symbol === "WGNET" || c.symbol === "GNET",
  );
  const gnetPrice = gnetComp?.priceUSD ?? 0;
  const baseWorth = pool.totalWorthUSD;
  const supply = gubiSupply > 0 ? gubiSupply : pool.supply;
  let cumGNET = 0;
  return INFLOW_SCHEDULE.map(([label, inflow]) => {
    cumGNET += inflow;
    const projectedWorth = baseWorth + cumGNET * gnetPrice;
    const backingPerGubi = supply > 0 ? projectedWorth / supply : 0;
    return { label, inflow, cumulative: cumGNET, backingPerGubi };
  });
}

function App() {
  // --- Data state ---
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [pool, setPool] = useState<PoolData | null>(null);
  const [gubiSupply, setGubiSupply] = useState<number>(0);
  const [snapshotBlock, setSnapshotBlock] = useState<number>(0);
  const [snapshotTs, setSnapshotTs] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState("");
  const [error, setError] = useState("");

  // --- Wallet state ---
  const [walletAddr, setWalletAddr] = useState("");
  const [walletError, setWalletError] = useState("");

  // --- Simulator state ---
  const [simAddress, setSimAddress] = useState("");
  const [additionalGNET, setAdditionalGNET] = useState(0);
  const [extensionDays, setExtensionDays] = useState(0);
  const [extraSoul, setExtraSoul] = useState(0);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [showPool, setShowPool] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [view, setView] = useState<"main" | "lab">("main");
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "en" || saved === "fr") return saved;
    return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
  });
  const langRef = useRef<Lang>("en");
  langRef.current = lang;
  const T = translations[lang];

  // --- Load all data ---
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setLoadProgress(translations[langRef.current].loadFetchingLeaderboard);

      const [lbItems, statsData, poolData] = await Promise.all([
        fetchAllLeaderboard(),
        fetchStats(),
        fetchPool(),
      ]);
      setStats(statsData);
      setPool(poolData);

      const addresses = lbItems.map((i) => i.address);
      setLoadProgress(translations[langRef.current].loadFetchingUserDetails(addresses.length));

      const userDataMap = await fetchUsersInBatches(addresses, 10);
      setLoadProgress(translations[langRef.current].loadFetchingLockData);

      const [, supply, blockNum] = await Promise.all([
        readMaxTime(),
        readGubiTotalSupply(),
        getCurrentBlock(),
      ]);
      setGubiSupply(supply);
      setSnapshotBlock(blockNum);
      setSnapshotTs(Math.floor(Date.now() / 1000));

      // Fetch all lock data pinned to this block for consistency
      setLoadProgress(translations[langRef.current].loadFetchingLockDataBlock(blockNum));
      const pinnedLockDataMap = await readLockDataBatch(addresses, 10, blockNum);

      // Enrich
      const enriched: EnrichedUser[] = lbItems.map((item) => {
        const addr = item.address.toLowerCase();
        const ud = userDataMap.get(addr);
        const ld = pinnedLockDataMap.get(addr);
        const soulScore = ud?.points ?? item.points;
        const lockedGNET = ld?.locked ?? 0;
        const lockEnd = ld?.lockEnd ?? 0;
        // Use on-chain balanceOf as real-time veGNET (decays every second)
        const balanceOfVeGNET = ld?.balanceOf ?? 0;
        const veGNET = balanceOfVeGNET;
        const reputation = calcReputation(soulScore, veGNET);
        return {
          address: item.address,
          rank: item.rank,
          points: item.points,
          soulScore,
          reputation,
          veGNET,
          lockedGNET,
          lockEnd,
          balanceOfVeGNET,
          monthlyReward: ud?.monthlyReward ?? 0,
          totalEarnings: ud?.totalEarnings ?? 0,
          alreadyClaimed: ud?.alreadyClaimed ?? 0,
          share: ud?.share ?? 0,
        };
      });

      // Re-rank by computed reputation
      enriched.sort((a, b) => b.reputation - a.reputation);
      enriched.forEach((u, i) => (u.rank = i + 1));

      // Compute monthly rewards from computed reputation
      const totalRep = enriched.reduce((s, u) => s + u.reputation, 0);
      enriched.forEach((u) => {
        if (totalRep > 0) {
          u.monthlyReward = (u.reputation / totalRep) * MONTHLY_EMISSION;
        }
      });

      setUsers(enriched);
      setLoadProgress("");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (window.matchMedia("(max-width: 600px)").matches) {
      setShowStats(false);
    }
  }, []);

  // --- MetaMask connect ---
  const handleConnect = async () => {
    setWalletError("");
    try {
      const addr = await connectMetaMask();
      if (addr) {
        setWalletAddr(addr);
        setSimAddress(addr);
      }
    } catch (e: unknown) {
      setWalletError(String(e));
    }
  };

  // Auto-select wallet user
  useEffect(() => {
    if (walletAddr && users.length > 0) {
      const found = users.find(
        (u) => u.address.toLowerCase() === walletAddr.toLowerCase(),
      );
      if (found) setSimAddress(found.address);
    }
  }, [walletAddr, users]);

  // Clamp extensionDays to the maximum possible when the selected user changes
  useEffect(() => {
    if (simAddress === NEW_WALLET) return; // new wallet starts at 0 days, max is 730
    const user = users.find((u) => u.address.toLowerCase() === simAddress.toLowerCase());
    if (user) {
      const now = Math.floor(Date.now() / 1000);
      const daysLeft = user.lockEnd > now ? Math.floor((user.lockEnd - now) / 86400) : 0;
      const maxExt = Math.max(0, 730 - daysLeft);
      setExtensionDays((d) => Math.min(d, maxExt));
    }
  }, [simAddress, users]);

  // Run simulation — debounced 150ms so slider drags don't block the UI
  const simTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!simAddress || users.length === 0) { setSimResult(null); return; }
    let user: EnrichedUser | undefined;
    if (simAddress === NEW_WALLET) {
      user = {
        address: NEW_WALLET, rank: users.length + 1, points: 0,
        soulScore: 0, reputation: 0, veGNET: 0, lockedGNET: 0,
        lockEnd: 0, balanceOfVeGNET: 0, monthlyReward: 0,
        totalEarnings: 0, alreadyClaimed: 0, share: 0,
      };
    } else {
      user = users.find((u) => u.address.toLowerCase() === simAddress.toLowerCase());
    }
    if (!user) { setSimResult(null); return; }
    clearTimeout(simTimerRef.current);
    simTimerRef.current = setTimeout(() => {
      setSimResult(simulate(user!, users, additionalGNET, extensionDays, extraSoul));
    }, 150);
    return () => clearTimeout(simTimerRef.current);
  }, [simAddress, additionalGNET, extensionDays, extraSoul, users]);

  const poolProjection = computePoolProjection(pool, gubiSupply);
  const label = (s: string) => <span style={{ color: C.textDim, marginRight: 6, userSelect: "none" }}>{s}</span>;
  const deltaColor = (n: number) => n > 0 ? C.green : n < 0 ? C.red : C.text;

  useEffect(() => {
    if (!showPool) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPool(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPool]);

  useEffect(() => {
    if (!showHelp) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowHelp(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showHelp]);

  // Leaderboard with simulation applied: replace selected user's rep, re-sort
  const now = Math.floor(Date.now() / 1000);
  const initialPoolTotalRep = useMemo(() => users.reduce((s, u) => s + u.reputation, 0), [users]);
  const selectedUser = useMemo(() => users.find(u => u.address.toLowerCase() === simAddress.toLowerCase()) ?? null, [users, simAddress]);
  const walletUser = useMemo(() => walletAddr ? (users.find(u => u.address.toLowerCase() === walletAddr.toLowerCase()) ?? null) : null, [users, walletAddr]);
  const displayUsers = useMemo(() => {
    if (!simResult || !simAddress) return users;
    if (simAddress === NEW_WALLET) {
      const virtualUser: EnrichedUser = {
        address: NEW_WALLET, rank: 0, points: 0,
        soulScore: simResult.simSoulScore, reputation: simResult.simReputation,
        veGNET: simResult.simVeGNET, lockedGNET: simResult.simLockedGNET,
        lockEnd: 0, balanceOfVeGNET: 0, monthlyReward: simResult.simMonthlyReward,
        totalEarnings: 0, alreadyClaimed: 0, share: 0,
      };
      const withVirtual = [...users, virtualUser];
      withVirtual.sort((a, b) => b.reputation - a.reputation);
      return withVirtual.map((u, i) => ({ ...u, rank: i + 1 }));
    }
    const simAddrLow = simAddress.toLowerCase();
    const withSim = users.map((u) =>
      u.address.toLowerCase() === simAddrLow
        ? { ...u, reputation: simResult.simReputation, monthlyReward: simResult.simMonthlyReward }
        : u
    );
    withSim.sort((a, b) => b.reputation - a.reputation);
    return withSim.map((u, i) => ({ ...u, rank: i + 1 }));
  }, [simResult, simAddress, users]);

  const TOP_N = 12;
  type LbItem = { type: "user"; u: EnrichedUser } | { type: "gap" };
  const visibleItems = useMemo<LbItem[]>(() => {
    if (showAllUsers || displayUsers.length <= TOP_N) return displayUsers.map((u) => ({ type: "user" as const, u }));
    const top = displayUsers.slice(0, TOP_N);
    const selIdx = simAddress
      ? displayUsers.findIndex((u) => u.address.toLowerCase() === simAddress.toLowerCase())
      : -1;
    if (selIdx === -1 || selIdx < TOP_N) return top.map((u) => ({ type: "user" as const, u }));
    return [
      ...top.map((u) => ({ type: "user" as const, u })),
      { type: "gap" as const },
      { type: "user" as const, u: displayUsers[selIdx] },
    ];
  }, [displayUsers, simAddress, showAllUsers]);

  // Auto-scroll leaderboard to the selected row when selection changes (desktop only)
  const selectedRowRef = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    if (window.innerWidth <= 900) return;
    if (selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [simAddress, users]);

  const formatLockEnd = (lockEnd: number) => {
    if (lockEnd <= 0) return "—";
    const date = formatDate(lockEnd);
    const daysLeft = lockEnd > now ? Math.floor((lockEnd - now) / 86400) : 0;
    return daysLeft > 0 ? `${date} (${daysLeft}d)` : `${date} (${T.lockExpired})`;
  };

  return (
    <div className="app-root" style={{ fontFamily: "monospace", fontSize: 13, background: C.bg, color: C.text, minHeight: "100vh", boxSizing: "border-box" }}>

      {/* Header */}
      <div className="site-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
        <div className="header-brand">
          <div className="header-title" style={{ fontWeight: "bold", color: C.accent, letterSpacing: "0.06em" }}>HowMuchUp</div>
          <div style={{ color: C.textDim, fontSize: 11, marginTop: 2 }}>{T.subtitle}</div>
        </div>
        <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button style={{ ...btnStyle, fontSize: 12, padding: "3px 10px" }} onClick={() => loadData()} disabled={loading} title={T.titleRefresh}>
            {T.btnRefresh}
          </button>
          <button style={{ ...btnStyle, fontSize: 12, padding: "3px 10px", borderColor: C.borderAccent, color: C.textDim }} onClick={() => setShowPool(v => !v)} title={T.titlePool}>
            {showPool ? T.btnClosePool : T.btnPoolProjection}
          </button>
          <button style={{ ...btnStyle, fontSize: 12, padding: "3px 10px", borderColor: showHelp ? C.accent : C.borderAccent, color: showHelp ? C.accent : C.textDim }} onClick={() => setShowHelp(v => !v)} title={T.titleHelp}>
            {T.btnHelp}
          </button>
          <button style={{ ...btnStyle, fontSize: 12, padding: "3px 10px", borderColor: view === "lab" ? C.accent : C.borderAccent, color: view === "lab" ? C.accent : C.textDim }} onClick={() => setView(v => v === "lab" ? "main" : "lab")} title="⚗ Lab — gUBI projection">
            {view === "lab" ? T.labBtnBack : T.labBtnOpen}
          </button>
          <button style={{ ...btnStyle, fontSize: 12, padding: "3px 10px", borderColor: C.borderAccent, color: C.textDim }} onClick={() => setLang(l => { const n = l === "en" ? "fr" : "en"; localStorage.setItem("lang", n); return n; })} title="Switch language / Changer de langue">
            {lang === "en" ? "FR" : "EN"}
          </button>
          {walletError && <span style={{ color: C.red, fontSize: 12 }}>{walletError}</span>}
          {!isMetaMaskInstalled() ? (
            <span style={{ color: C.textDim }}>{T.noMetaMask}</span>
          ) : walletAddr ? (
            <span style={{ color: C.green }}>● {shortAddr(walletAddr)}</span>
          ) : (
            <button style={btnStyle} onClick={handleConnect}>{T.btnConnectMetaMask}</button>
          )}
        </div>
      </div>

      {/* Loading / error */}
      {loading && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ height: 2, background: C.border, borderRadius: 2, marginBottom: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", background: C.accent, borderRadius: 2, width: "100%", animation: "pulse-bar 1.4s ease-in-out infinite", transformOrigin: "left" }} />
          </div>
          <div style={{ color: C.textDim, fontSize: 12 }}>⏳ {loadProgress || T.loadingDefault}</div>
        </div>
      )}
      {error && <div style={{ color: C.red, marginBottom: 8 }}>{T.errorPrefix} {error}</div>}

      {/* Stats */}
      {stats && pool && (
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ color: C.accent, fontWeight: "bold" }}>{T.statsTitle}</div>
            <button
              style={{ ...btnStyle, fontSize: 11, padding: "2px 8px", borderColor: C.borderAccent, color: C.textDim }}
              onClick={() => setShowStats((v) => !v)}
              title={showStats ? T.titleHideStats : T.titleShowStats}
            >
              {showStats ? T.btnHide : T.btnShow}
            </button>
          </div>
          {showStats && (
            <div className="stats-grid" style={{ marginTop: 10 }}>
              <span>{label(T.statUsers)} <b style={{ color: C.textBright }}>{stats.totalUsers}</b></span>
              <span>{label(T.statTotalRep)} <b style={{ color: C.textBright }}>{formatNumber(stats.totalReputation, 0)}</b></span>
              <span>{label(T.statEmission)} <b style={{ color: C.textBright }}>{formatNumber(MONTHLY_EMISSION, 0)}</b> {T.gubiPerMonth}</span>
              <span>{label(T.statPool)} <b style={{ color: C.textBright }}>${formatNumber(pool.totalWorthUSD)}</b></span>
              <span>{label(T.statGubiPrice)} <b style={{ color: C.textBright }}>${formatNumber(pool.gubiPrice, 6)}</b></span>
              <span>{label(T.statGubiSupply)} <b style={{ color: C.textBright }}>{formatNumber(gubiSupply, 0)}</b></span>
              <span>{label(T.statBacking)} <b style={{ color: C.textBright }}>${gubiSupply > 0 ? formatNumber(pool.totalWorthUSD / gubiSupply, 6) : "—"}</b></span>
              {snapshotBlock > 0 && <span>{label(T.statBlock)} <b style={{ color: C.textBright }}>{snapshotBlock}</b></span>}
              {snapshotTs > 0 && <span>{label(T.statSnapshot)} {new Date(snapshotTs * 1000).toISOString().replace("T", " ").slice(0, 19)} UTC</span>}
            </div>
          )}
        </div>
      )}

      {/* Main layout: Leaderboard (left / order 1) + Simulator (right / order 2, sticky) */}
      {!loading && users.length > 0 && view === "lab" && (
        <Lab lang={lang} walletUser={walletUser} selectedUser={selectedUser} initialPoolTotalRep={initialPoolTotalRep} onBack={() => setView("main")} />
      )}
      {!loading && users.length > 0 && view === "main" && (
        <div className="main-layout">
        <div className="sim-col">
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ color: C.accent, fontWeight: "bold" }}>{T.simTitle}</div>
            {(additionalGNET !== 0 || extensionDays !== 0 || extraSoul !== 0) && (
              <button style={{ ...btnStyle, fontSize: 11, padding: "2px 8px", borderColor: C.borderAccent, color: C.textDim }}
                onClick={() => { setAdditionalGNET(0); setExtensionDays(0); setExtraSoul(0); }}>
                {T.btnReset}
              </button>
            )}
          </div>
          {/* Address selection row */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {label(T.lblAddress)}
              <input style={{ ...inputStyle, flex: 1, minWidth: 0 }} type="text"
                value={simAddress === NEW_WALLET ? "" : simAddress}
                onChange={(e) => setSimAddress(e.target.value)} placeholder={T.placeholderAddress} />
              <button
                style={{ ...btnStyle, fontSize: 11, padding: "2px 8px", borderColor: simAddress === NEW_WALLET ? C.accent : C.borderAccent, color: simAddress === NEW_WALLET ? C.accent : C.textDim, whiteSpace: "nowrap" }}
                onClick={() => setSimAddress(simAddress === NEW_WALLET ? "" : NEW_WALLET)}
                title={T.btnNewWallet}
              >{T.btnNewWallet}</button>
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {label(T.lblOrPick)}
              <select style={{ ...inputStyle, flex: 1, minWidth: 0 }} value={simAddress === NEW_WALLET ? "" : simAddress} onChange={(e) => setSimAddress(e.target.value)}>
                <option value="">{T.placeholderSelect}</option>
                {users.map((u) => (
                  <option key={u.address} value={u.address}>
                    #{u.rank} {shortAddr(u.address)} · {formatNumber(u.reputation, 0)} rep
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Sliders */}
          {(() => {
            const maxExtension = simAddress === NEW_WALLET ? 730 : (simResult ? Math.max(0, 730 - simResult.currentDaysLeft) : 730);
            const lockHint = simResult
              ? `→ ${simResult.simDaysLeft}d / 730${simResult.currentDaysLeft >= 730 ? " (maxed)" : ""}`
              : undefined;
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                {([
                  { lbl: T.sliderGNET,  val: additionalGNET, set: setAdditionalGNET, min: 0, max: 100000,      numMax: Infinity,    step: 500, rangeStep: 50,  hint: undefined, showMax: false },
                  { lbl: T.sliderDays,  val: extensionDays,  set: setExtensionDays,  min: 0, max: maxExtension, numMax: maxExtension, step: 1,   rangeStep: 1,   hint: lockHint,  showMax: true },
                  { lbl: T.sliderSoul,  val: extraSoul,      set: setExtraSoul,      min: 0, max: 5000,         numMax: Infinity,    step: 10,  rangeStep: 1,   hint: undefined, showMax: false },
                ] as { lbl: string; val: number; set: (v: number) => void; min: number; max: number; numMax: number; step: number; rangeStep: number; hint?: string; showMax: boolean }[]).map(
                  ({ lbl, val, set, min, max, numMax, step, rangeStep, hint, showMax }) => (
                    <div key={lbl} className="slider-row">
                      <span className="slider-label" style={{ color: C.muted, fontSize: 11, letterSpacing: "0.05em" }}>{lbl}</span>
                      <input
                        type="range" min={min} max={max || 1} step={rangeStep} value={Math.min(val, max || 1)}
                        onChange={(e) => set(Number(e.target.value))}
                        className="slider-track"
                        style={{ accentColor: C.accent, cursor: max === 0 ? "not-allowed" : "pointer", height: 4, opacity: max === 0 ? 0.35 : 1 }}
                        disabled={max === 0}
                      />
                      <input
                        type="number" min={min} max={numMax === Infinity ? undefined : numMax} step={step} value={val}
                        onChange={(e) => set(Math.max(min, numMax === Infinity ? (Number(e.target.value) || 0) : Math.min(numMax, Number(e.target.value) || 0)))}
                        className="slider-number"
                        style={{ ...inputStyle, textAlign: "right" }}
                        disabled={max === 0}
                      />
                      <span className="slider-hint" style={{ color: C.muted, fontSize: 10, whiteSpace: "nowrap" }}>{hint ?? ""}</span>
                      {showMax && max > 0 && val < max && (
                        <button className="slider-max" onClick={() => set(max)} style={{ ...btnStyle, fontSize: 10, padding: "2px 7px", borderColor: C.borderAccent, color: C.textDim }}>{T.btnMAX}</button>
                      )}
                      {(!showMax || max === 0 || val >= max) && <span className="slider-max-placeholder" />}
                    </div>
                  )
                )}
              </div>
            );
          })()}

          {!simAddress && simAddress !== NEW_WALLET && (
            <div style={{ color: C.textDim, fontSize: 12, marginTop: 8, textAlign: "center" }}>
              {T.simEmptyHint}
            </div>
          )}
          {simAddress && simAddress !== NEW_WALLET && !users.find((u) => u.address.toLowerCase() === simAddress.toLowerCase()) && (
            <div style={{ color: C.orange, marginBottom: 6 }}>{T.addrNotFound}</div>
          )}

          {simResult && (
            <table style={{ borderCollapse: "collapse", width: "100%", marginTop: 10 }}>
              <thead>
                <tr>
                  <th style={th}>{T.colMetric}</th>
                  <th style={th}>{T.colCurrent}</th>
                  <th style={th}>{T.colSimulated}</th>
                  <th style={th}>{T.colDelta}</th>
                </tr>
              </thead>
              <tbody>
                {([
                  [T.rowSoulScore,   simResult.currentSoulScore,    simResult.simSoulScore,    0],
                  [T.rowLockedGNET,  simResult.currentLockedGNET,  simResult.simLockedGNET,   2],
                  [T.rowLockDays,    simResult.currentDaysLeft,    simResult.simDaysLeft,     0],
                  [T.rowVeGNET,      simResult.currentVeGNET,      simResult.simVeGNET,       4],
                  [T.rowReputation,  simResult.currentReputation,  simResult.simReputation,   2],
                ] as [string, number, number, number][]).map(([name, cur, sim, dec]) => (
                  <tr key={name}>
                    <td style={td}>{name}</td>
                    <td style={tdRight}>{formatNumber(cur, dec)}</td>
                    <td style={tdRight}>{formatNumber(sim, dec)}</td>
                    <td style={{ ...tdRight, color: deltaColor(sim - cur) }}>{sim - cur >= 0 ? "+" : ""}{formatNumber(sim - cur, dec)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: `2px solid ${C.borderAccent}` }}>
                  <td style={{ ...td, fontWeight: "bold", color: C.textBright }}>{T.rowRank}</td>
                  <td style={{ ...tdRight, fontWeight: "bold" }}>#{simResult.currentRank}</td>
                  <td style={{ ...tdRight, fontWeight: "bold" }}>#{simResult.simRank}</td>
                  <td style={{ ...tdRight, fontWeight: "bold", color: deltaColor(simResult.deltaRank) }}>
                    {simResult.deltaRank > 0 ? `↑${simResult.deltaRank}` : simResult.deltaRank < 0 ? `↓${Math.abs(simResult.deltaRank)}` : "—"}
                  </td>
                </tr>
                <tr>
                  <td style={{ ...td, fontWeight: "bold", color: C.textBright }}>{T.rowMonthlyGubi}</td>
                  <td style={{ ...tdRight, fontWeight: "bold" }}>{formatNumber(simResult.currentMonthlyReward)}</td>
                  <td style={{ ...tdRight, fontWeight: "bold" }}>{formatNumber(simResult.simMonthlyReward)}</td>
                  <td style={{ ...tdRight, fontWeight: "bold", color: deltaColor(simResult.deltaReward) }}>
                    {simResult.deltaReward >= 0 ? "+" : ""}{formatNumber(simResult.deltaReward)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>{/* /card */}
        </div>{/* /sim-col */}
        <div className="lb-col">
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "8px 14px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ color: C.accent, fontWeight: "bold" }}>{T.lbTitle} <span style={{ color: C.textDim, fontWeight: "normal" }}>({users.length} {T.statUsers})</span></div>
            {simResult && <div style={{ color: C.orange, fontSize: 11, fontWeight: "normal", marginTop: 2 }}>{T.lbSimNotice} {simAddress === NEW_WALLET ? T.newWalletLabel : shortAddr(simAddress)}</div>}
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th style={th}>{T.colHash}</th>
                  <th style={th}>{T.colAddress}</th>
                  <th style={th} className="col-hide-mobile">{T.colSoulScore}</th>
                  <th style={th} className="col-hide-mobile">{T.colLockedGNET}</th>
                  <th style={th} className="col-hide-mobile">{T.colVeGNET}</th>
                  <th style={th}>{T.colReputation}</th>
                  <th style={th}>{T.colMonthlyGubi}</th>
                  <th style={th} className="col-hide-mobile">{T.colLockEnd}</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => {
                  if (item.type === "gap") {
                    return (
                      <tr key="gap">
                        <td colSpan={8} style={{ ...td, textAlign: "center", color: C.textDim, fontSize: 10, padding: "4px", letterSpacing: "0.3em" }}>···</td>
                      </tr>
                    );
                  }
                  const u = item.u;
                  const isSelected = u.address.toLowerCase() === simAddress.toLowerCase();
                  return (
                    <tr
                      key={u.address}
                      ref={isSelected ? selectedRowRef : undefined}
                      onClick={() => setSimAddress(u.address)}
                      style={{ background: isSelected ? C.highlight : undefined, cursor: "pointer" }}
                      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = C.highlightRow; }}
                      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
                    >
                      <td style={{ ...td, color: isSelected && simResult ? C.orange : C.textDim }}>{u.rank}</td>
                      <td style={td}>
                        {u.address === NEW_WALLET ? (
                          <span style={{ color: C.orange, fontStyle: "italic" }}>{T.newWalletLabel}</span>
                        ) : (
                          <a style={{ color: isSelected ? C.orange : C.accent, textDecoration: "none" }}
                            href="#" title={u.address}
                            onClick={(e) => { e.preventDefault(); setSimAddress(u.address); }}>
                            {shortAddr(u.address)}
                          </a>
                        )}
                      </td>
                      <td style={tdRight} className="col-hide-mobile">{formatNumber(u.soulScore, 0)}</td>
                      <td style={tdRight} className="col-hide-mobile">{formatNumber(u.lockedGNET)}</td>
                      <td style={tdRight} className="col-hide-mobile">{formatNumber(simResult && isSelected ? simResult.simVeGNET : u.veGNET)}</td>
                      <td style={tdRight}>{formatNumber(u.reputation)}</td>
                      <td style={tdRight}>{formatNumber(u.monthlyReward)}</td>
                      <td style={{ ...td, color: C.textDim }} className="col-hide-mobile">{formatLockEnd(u.lockEnd)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {displayUsers.length > TOP_N && (
            <div style={{ padding: "8px 14px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {simAddress && !showAllUsers && (() => {
                const selIdx = displayUsers.findIndex((u) => u.address.toLowerCase() === simAddress.toLowerCase());
                return selIdx >= TOP_N ? (
                  <span style={{ color: C.textDim, fontSize: 11 }}>{T.yourSimRank(displayUsers[selIdx].rank)}</span>
                ) : null;
              })()}
              <button
                style={{ ...btnStyle, fontSize: 11, padding: "3px 14px" }}
                onClick={() => setShowAllUsers((v) => !v)}
              >
                {showAllUsers ? T.btnCollapse : T.btnShowAll(displayUsers.length)}
              </button>
            </div>
          )}
        </div>{/* /card */}
        </div>{/* /lb-col */}
        </div>
      )}

      {/* Pool Projection Modal */}
      {pool && showPool && (
        <div className="modal-backdrop" onClick={() => setShowPool(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ color: C.accent, fontWeight: "bold", marginBottom: 4 }}>{T.poolTitle}</div>
                <div style={{ color: C.text, fontSize: 12, marginBottom: 4 }}>
                  {T.poolDesc}
                </div>
                <div style={{ color: C.textDim, fontSize: 12 }}>
                  {T.poolBase}: ${formatNumber(pool.totalWorthUSD)} pool · {formatNumber(gubiSupply, 0)} gUBI supply · ${gubiSupply > 0 ? formatNumber(pool.totalWorthUSD / gubiSupply, 6) : "—"} current backing
                </div>
              </div>
              <button style={{ ...btnStyle, padding: "3px 10px", fontSize: 12 }} onClick={() => setShowPool(false)}>
                {T.btnClose}
              </button>
            </div>
            <div className="modal-table-wrap">
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={th}>{T.colPeriod}</th>
                    <th style={th}>{T.colGNETInflow}</th>
                    <th style={th}>{T.colCumulativeGNET}</th>
                    <th style={th}>{T.colProjectedBacking}</th>
                  </tr>
                </thead>
                <tbody>
                  {poolProjection.map((row, i) => (
                    <tr key={i}>
                      <td style={td}>{row.label}</td>
                      <td style={tdRight}>{formatNumber(row.inflow, 0)}</td>
                      <td style={tdRight}>{formatNumber(row.cumulative, 0)}</td>
                      <td style={tdRight}>${formatNumber(row.backingPerGubi, 6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="modal-backdrop" onClick={() => setShowHelp(false)}>
          <div className="modal-card" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ color: C.accent, fontWeight: "bold", fontSize: 14 }}>{T.helpTitle}</div>
              <button style={{ ...btnStyle, padding: "3px 10px", fontSize: 12 }} onClick={() => setShowHelp(false)}>{T.btnClose}</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, color: C.text, fontSize: 12, lineHeight: 1.6 }}>

              <section>
                <div style={{ color: C.textBright, fontWeight: "bold", marginBottom: 4 }}>{T.helpVeGNETTitle}</div>
                <div style={{ color: C.textDim }}>{T.helpVeGNETFormula}</div>
                <div style={{ marginTop: 4 }}>{T.helpVeGNETBody}</div>
              </section>

              <section>
                <div style={{ color: C.textBright, fontWeight: "bold", marginBottom: 4 }}>{T.helpRepTitle}</div>
                <div style={{ color: C.textDim }}>{T.helpRepFormula}</div>
                <div style={{ marginTop: 4 }}>{T.helpRepBody}</div>
              </section>

              <section>
                <div style={{ color: C.textBright, fontWeight: "bold", marginBottom: 4 }}>{T.helpGubiTitle}</div>
                <div style={{ color: C.textDim }}>{T.helpGubiFormula}</div>
                <div style={{ marginTop: 4 }}>{T.helpGubiBody}</div>
              </section>

              <section>
                <div style={{ color: C.textBright, fontWeight: "bold", marginBottom: 4 }}>{T.helpSlidersTitle}</div>
                <div style={{ marginTop: 0 }}>
                  <span style={{ color: C.textDim }}>{T.sliderGNET}</span> {T.helpSliderGNETDesc}<br />
                  <span style={{ color: C.textDim }}>{T.sliderDays}</span> {T.helpSliderDaysDesc}<br />
                  <span style={{ color: C.textDim }}>{T.sliderSoul}</span> {T.helpSliderSoulDesc}
                </div>
              </section>

              <section>
                <div style={{ color: C.textBright, fontWeight: "bold", marginBottom: 4 }}>{T.helpSourcesTitle}</div>
                <div>{T.helpSourcesBody}</div>
              </section>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
