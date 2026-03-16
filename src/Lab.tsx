import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { projectGUBI } from "./lab";
import type { LabParams } from "./lab";
import { formatNumber } from "./utils";
import type { EnrichedUser } from "./types";
import type { Lang } from "./i18n";
import { INFLOW_SCHEDULE } from "./constants";
import { translations } from "./i18n";

// ── palette (mirrors App.tsx) ────────────────────────────────────────────────
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
  red: "#f55",
  green: "#4c4",
  orange: "#fa0",
};

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

// ── helpers ──────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: C.muted, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function NumberInput({
  value, onChange, min = 0, max, step = 1, style,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  style?: React.CSSProperties;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const v = Number(e.target.value) || 0;
        const clamped = max !== undefined ? Math.min(max, Math.max(min, v)) : Math.max(min, v);
        onChange(clamped);
      }}
      style={{ ...inputStyle, width: 90, textAlign: "right", ...style }}
    />
  );
}

function SliderRow({
  label, value, onChange, min = 0, max, step = 1, rangeStep, tooltip,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max: number;
  step?: number;
  rangeStep?: number;
  tooltip?: string;
}) {
  return (
    <div className="slider-row">
      <span className="slider-label" style={{ color: C.muted, fontSize: 11, letterSpacing: "0.05em", cursor: tooltip ? "help" : undefined }} title={tooltip}>{label}</span>
      <input
        type="range" min={min} max={max || 1} step={rangeStep ?? step}
        value={Math.min(value, max || 1)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-track"
        style={{ accentColor: C.accent, cursor: "pointer", height: 4 }}
      />
      <input
        type="number" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        className="slider-number"
        style={{ ...inputStyle, textAlign: "right" }}
      />
      <span className="slider-hint" />
      <span className="slider-max-placeholder" />
    </div>
  );
}

function Toggle({ checked, onChange, label, tooltip }: { checked: boolean; onChange: (v: boolean) => void; label: string; tooltip?: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: C.text, fontSize: 13 }} title={tooltip}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: C.accent, width: 15, height: 15 }}
      />
      {label}
    </label>
  );
}

// ── props ────────────────────────────────────────────────────────────────────
interface LabProps {
  lang: Lang;
  walletUser: EnrichedUser | null;
  selectedUser: EnrichedUser | null;
  initialPoolTotalRep: number;
  onBack: () => void;
}

// ── component ────────────────────────────────────────────────────────────────
export default function Lab({ lang, walletUser, selectedUser, initialPoolTotalRep, onBack }: LabProps) {
  const T = translations[lang];

  // Priority: connected wallet > simAddress selection > zeros
  const prefillUser = walletUser ?? selectedUser;
  const now = Math.floor(Date.now() / 1000);

  function userToState(u: EnrichedUser | null) {
    return {
      gnet: Math.round(u?.lockedGNET ?? 0),
      days: u?.lockEnd ? Math.max(0, Math.round((u.lockEnd - now) / 86400)) : 0,
      soul: Math.round(u?.soulScore ?? 100),
    };
  }

  const initial = userToState(prefillUser);

  // Starting position — pre-filled from wallet/selected user if available
  const [startLockedGNET, setStartLockedGNET] = useState(initial.gnet);
  const [startDaysLeft,   setStartDaysLeft]   = useState(initial.days);
  const [soulScore, setSoulScore] = useState(initial.soul);

  function fillFromUser() {
    const s = userToState(prefillUser);
    setStartLockedGNET(s.gnet); setStartDaysLeft(s.days); setSoulScore(s.soul);
  }
  function startFresh() {
    setStartLockedGNET(0); setStartDaysLeft(0); setSoulScore(100);
  }

  // Contribution strategy
  const [addGNET,           setAddGNET]           = useState(0);
  const [addFrequencyWeeks, setAddFrequencyWeeks] = useState<number>(1);
  const [extendOnAdd,       setExtendOnAdd]       = useState(false);
  const [relockDays,        setRelockDays]        = useState(365);
  const [relockExpired,     setRelockExpired]     = useState(false);

  // Horizon
  const [horizonMonths, setHorizonMonths] = useState(12);

  // Pool scenario
  const [poolGrowthPct, setPoolGrowthPct] = useState(2);
  const [spreadPct,     setSpreadPct]     = useState(2);

  const freqOptions: { weeks: number; label: string; tip: string }[] = [
    { weeks: 0,  label: T.labFreqNone,      tip: T.tipFreqNone },
    { weeks: 1,  label: T.labFreqWeekly,    tip: T.tipFreqWeekly },
    { weeks: 2,  label: T.labFreqBiweekly,  tip: T.tipFreqBiweekly },
    { weeks: 4,  label: T.labFreqMonthly,   tip: T.tipFreqMonthly },
  ];

  const horizonOptions = [3, 6, 12, 24];

  const params: LabParams = {
    startLockedGNET,
    startDaysLeft: Math.round(startDaysLeft / 7) * 7, // snap to week
    soulScore,
    addGNET: addFrequencyWeeks === 0 ? 0 : addGNET,
    addFrequencyWeeks: addFrequencyWeeks === 0 ? 999 : addFrequencyWeeks,
    extendOnAdd: addFrequencyWeeks > 0 && extendOnAdd,
    relockDays,
    relockExpired,
    horizonMonths,
    poolGrowthPctPerMonth: poolGrowthPct,
    spreadPct,
    initialPoolTotalRep: initialPoolTotalRep > 0 ? initialPoolTotalRep : 1,
  };

  const points = useMemo(() => projectGUBI(params), [
    startLockedGNET, startDaysLeft, soulScore,
    addGNET, addFrequencyWeeks, extendOnAdd, relockDays, relockExpired,
    horizonMonths, poolGrowthPct, spreadPct, initialPoolTotalRep,
  ]);

  // Cumulative sums
  const tableData = useMemo(() => {
    let cumPess = 0, cumNeutral = 0, cumOpt = 0;
    return points.map((p) => {
      cumPess    += p.gubi_pess;
      cumNeutral += p.gubi_neutral;
      cumOpt     += p.gubi_opt;
      return { ...p, cumPess, cumNeutral, cumOpt };
    });
  }, [points]);

  const fmt = (n: number) => formatNumber(n, 0);

  return (
    <div style={{ color: C.text, fontFamily: "monospace", maxWidth: 1400, margin: "0 auto", padding: "0 0 40px" }}>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ ...btnStyle, fontSize: 12 }}>{T.labBtnBack}</button>
        <span style={{ color: C.textBright, fontSize: 18, fontWeight: "bold" }}>{T.labTitle}</span>
      </div>

      {/* Disclaimer */}
      <div style={{ ...card, background: "#1a1a12", borderColor: C.orange, color: C.orange, fontSize: 12, marginBottom: 16 }}>
        {T.labDisclaimer}
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* ── LEFT: Parameters ── */}
        <div style={{ flex: "1 1 320px", minWidth: 280 }}>
          {/* Starting position */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <SectionLabel>{T.labSectionStart}</SectionLabel>
              <div style={{ display: "flex", gap: 6 }}>
                {prefillUser && (
                  <button onClick={fillFromUser} title={T.tipFillWallet} style={{ ...btnStyle, fontSize: 10, padding: "2px 8px", borderColor: C.borderAccent, color: C.textDim }}>
                    ↺ {T.labFillWallet}
                  </button>
                )}
                <button onClick={startFresh} title={T.tipStartFresh} style={{ ...btnStyle, fontSize: 10, padding: "2px 8px", borderColor: C.borderAccent, color: C.textDim }}>
                  {T.labStartFresh}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SliderRow label={T.labStartGNET} value={startLockedGNET} onChange={setStartLockedGNET} max={500000} step={500} rangeStep={500} tooltip={T.tipStartGNET} />
              <SliderRow label={T.labStartDays}  value={startDaysLeft}   onChange={setStartDaysLeft}   max={730}    step={7}   rangeStep={7}   tooltip={T.tipStartDays} />
              <SliderRow label={T.labSoulScore}  value={soulScore}        onChange={setSoulScore}        max={10000}  step={10}  rangeStep={10}  tooltip={T.tipSoulScore} />
            </div>
          </div>

          {/* Contributions */}
          <div style={card}>
            <SectionLabel>{T.labAddGNET}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Frequency selector */}
              <div>
                <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>{T.labFrequency}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {freqOptions.map((opt) => (
                    <button
                      key={opt.weeks}
                      onClick={() => setAddFrequencyWeeks(opt.weeks)}
                      title={opt.tip}
                      style={{
                        ...btnStyle,
                        fontSize: 11,
                        padding: "2px 10px",
                        borderColor: addFrequencyWeeks === opt.weeks ? C.accent : C.borderAccent,
                        color: addFrequencyWeeks === opt.weeks ? C.accent : C.textDim,
                        background: addFrequencyWeeks === opt.weeks ? "#1a2a3a" : "#111",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {addFrequencyWeeks > 0 && (
                <>
                  <SliderRow label={T.labAddGNETSlider} value={addGNET} onChange={setAddGNET} max={50000} step={100} rangeStep={100} tooltip={T.tipAddGNETSlider} />
                  <Toggle checked={extendOnAdd} onChange={setExtendOnAdd} label={T.labExtendOnAdd} tooltip={T.tipExtendOnAdd} />
                  {extendOnAdd && (
                    <SliderRow label={T.labLockNewDays} value={relockDays} onChange={setRelockDays} max={730} step={7} rangeStep={7} tooltip={T.tipLockNewDays} />
                  )}
                </>
              )}

              {/* relock when expired is redundant if we extend on every add — hide it in that case */}
              {!(addFrequencyWeeks > 0 && extendOnAdd && addGNET > 0) && (
                <>
                  <Toggle checked={relockExpired} onChange={setRelockExpired} label={T.labRelockExpired} tooltip={T.tipRelockExpired} />
                  {relockExpired && (
                    <SliderRow label={T.labRelockDays} value={relockDays} onChange={setRelockDays} max={730} step={7} rangeStep={7} tooltip={T.tipRelockDays} />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Pool assumptions */}
          <div style={card}>
            <SectionLabel>{T.labSectionPool}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SliderRow label={T.labPoolGrowth} value={poolGrowthPct} onChange={setPoolGrowthPct} min={0} max={20} step={0.5} rangeStep={0.5} tooltip={T.tipPoolGrowth} />
              <SliderRow label={T.labSpread}     value={spreadPct}     onChange={setSpreadPct}     min={0} max={10} step={0.5} rangeStep={0.5} tooltip={T.tipSpread} />
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: C.textDim }}>
              {T.labScenarioPess}: {(poolGrowthPct + spreadPct).toFixed(1)}%/mo &nbsp;·&nbsp;
              {T.labScenarioNeutral}: {poolGrowthPct.toFixed(1)}%/mo &nbsp;·&nbsp;
              {T.labScenarioOpt}: {Math.max(0, poolGrowthPct - spreadPct).toFixed(1)}%/mo
            </div>
            {/* INFLOW_SCHEDULE hint */}
            {(() => {
              const nowTs = Math.floor(Date.now() / 1000);
              const nowDate = new Date(nowTs * 1000);
              const upcoming = INFLOW_SCHEDULE.filter(([label]) => {
                // Parse month names like "March 2026"
                const d = new Date(label);
                return !isNaN(d.getTime()) && d >= nowDate;
              }).slice(0, 3);
              if (upcoming.length === 0) return null;
              const total = upcoming.reduce((s, [, v]) => s + v, 0);
              return (
                <div style={{ marginTop: 8, fontSize: 10, color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: 6 }}>
                  ⚠️ Scheduled GNET unlocks (next {upcoming.length} months): {upcoming.map(([l, v]) => `${l.replace(/ 20\d\d/, '')} ${(v/1000).toFixed(0)}k`).join(', ')} — total ~{(total/1000).toFixed(0)}k GNET. If re-locked, pool rep grows. Factor this into pool growth %.
                </div>
              );
            })()}
          </div>

          {/* Horizon */}
          <div style={card}>
            <SectionLabel>{T.labHorizon}</SectionLabel>
            <div style={{ display: "flex", gap: 6 }}>
              {horizonOptions.map((m) => (
                <button
                  key={m}
                  onClick={() => setHorizonMonths(m)}
                  style={{
                    ...btnStyle,
                    fontSize: 11,
                    padding: "2px 12px",
                    borderColor: horizonMonths === m ? C.accent : C.borderAccent,
                    color: horizonMonths === m ? C.accent : C.textDim,
                    background: horizonMonths === m ? "#1a2a3a" : "#111",
                  }}
                >
                  {T.labMonths(m)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Chart + table ── */}
        <div style={{ flex: "2 1 480px", minWidth: 300 }}>
          {points.length < 2 ? (
            <div style={{ ...card, color: C.textDim, textAlign: "center", padding: 40 }}>{T.labNoData}</div>
          ) : (
            <>
              {/* Chart */}
              <div style={{ ...card, padding: "14px 4px 0" }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={points} margin={{ top: 4, right: 20, left: 10, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="monthLabel" tick={{ fill: C.textDim, fontSize: 11 }} />
                    <YAxis
                      tick={{ fill: C.textDim, fontSize: 11 }}
                      tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                      label={{ value: T.labChartYAxis, angle: -90, position: "insideLeft", fill: C.textDim, fontSize: 11, dx: -4 }}
                    />
                    <Tooltip
                      contentStyle={{ background: C.surface, border: `1px solid ${C.borderAccent}`, color: C.text, fontFamily: "monospace", fontSize: 12 }}
                      formatter={(value, name) => [fmt(Number(value ?? 0)) + " gUBI", String(name)]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: C.textDim }} />
                    <Line type="monotone" dataKey="gubi_pess"    name={T.labScenarioPess}    stroke={C.red}    strokeDasharray="4 2" dot={false} strokeWidth={1.5} />
                    <Line type="monotone" dataKey="gubi_neutral" name={T.labScenarioNeutral} stroke={C.accent} dot={false}            strokeWidth={2} />
                    <Line type="monotone" dataKey="gubi_opt"     name={T.labScenarioOpt}     stroke={C.green}  strokeDasharray="4 2" dot={false} strokeWidth={1.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Summary table */}
              <div style={{ ...card, overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={th}>{T.labTableMonth}</th>
                      <th style={{ ...th, color: C.red }}>{T.labTablePess}</th>
                      <th style={{ ...th, color: C.accent }}>{T.labTableNeutral}</th>
                      <th style={{ ...th, color: C.green }}>{T.labTableOpt}</th>
                      <th style={{ ...th, color: C.red, borderLeft: `2px solid ${C.border}` }}>{T.labTableCumPess}</th>
                      <th style={{ ...th, color: C.accent }}>{T.labTableCumNeutral}</th>
                      <th style={{ ...th, color: C.green }}>{T.labTableCumOpt}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row) => (
                      <tr key={row.week}>
                        <td style={td}>{row.monthLabel}</td>
                        <td style={{ ...tdRight, color: C.red }}>{fmt(row.gubi_pess)}</td>
                        <td style={{ ...tdRight, color: C.accent }}>{fmt(row.gubi_neutral)}</td>
                        <td style={{ ...tdRight, color: C.green }}>{fmt(row.gubi_opt)}</td>
                        <td style={{ ...tdRight, color: C.red, borderLeft: `2px solid ${C.border}` }}>{fmt(row.cumPess)}</td>
                        <td style={{ ...tdRight, color: C.accent }}>{fmt(row.cumNeutral)}</td>
                        <td style={{ ...tdRight, color: C.green }}>{fmt(row.cumOpt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
