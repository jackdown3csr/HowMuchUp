import { MONTHLY_EMISSION } from "./constants";
import { calcReputation } from "./utils";

/**
 * One entry from the loaded leaderboard — used to simulate exact per-user veGNET decay.
 */
export interface LabPoolUser {
  lockedGNET: number;
  lockEnd: number;   // unix timestamp
  soulScore: number;
}

export interface LabParams {
  startLockedGNET: number;
  startDaysLeft: number;       // floored to week boundary
  soulScore: number;
  addGNET: number;             // GNET added per contribution
  addFrequencyWeeks: number;   // 1 | 2 | 4
  extendOnAdd: boolean;        // also extend lock when adding
  relockDays: number;          // days to set when extending / re-locking (rounded to week)
  relockExpired: boolean;      // auto-relock when lock reaches 0
  horizonMonths: number;       // 3 | 6 | 12 | 24
  /**
   * Extra pool rep growth per month ON TOP of the natural veGNET decay.
   * 0 = pure decay (nobody new enters or re-locks). Positive = new entrants / re-lockers.
   * Negative (via spread) = some users exit early.
   */
  poolGrowthPctPerMonth: number;
  spreadPct: number;           // pess = neutral + spread, opt = neutral - spread (can be negative)
  initialPoolTotalRep: number;
  userActualReputation: number; // real on-chain rep at t=0; 0 = new wallet
  /** All pool participants EXCLUDING self, for precise per-user veGNET decay simulation. */
  poolUsers: LabPoolUser[];
  snapshotTs: number; // unix timestamp at week-0 (when lock data was read from chain)
}

export interface ProjectionPoint {
  week: number;
  month: number;
  monthLabel: string;
  veGNET: number;
  reputation: number;
  otherRep_pess: number;
  otherRep_neutral: number;
  otherRep_opt: number;
  poolRep_pess: number;
  poolRep_neutral: number;
  poolRep_opt: number;
  share_pess: number;
  share_neutral: number;
  share_opt: number;
  gubi_pess: number;
  gubi_neutral: number;
  gubi_opt: number;
}

function roundToWeek(days: number): number {
  return Math.floor(days / 7) * 7;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Pure math projection engine.
 * Mirrors real VotingEscrow: one lock per address.
 * Weekly ticks (7-day steps). Month boundaries are placed at real calendar positions
 * (365.25/12/7 ≈ 4.348 weeks/month) so both the time horizon and per-week emission
 * are calibrated to actual calendar months, not the 4-weeks-per-month approximation.
 *
 * Pool competition = exact per-user veGNET decay simulation (using real lockEnd from chain)
 * + an optional extra-growth term on top (poolGrowthPctPerMonth) representing new entrants
 * and re-lockers. poolGrowthPctPerMonth = 0 → pure deterministic decay (pessimistic floor).
 */
export function projectGUBI(p: LabParams): ProjectionPoint[] {
  const WEEKS_PER_MONTH = 365.25 / 12 / 7; // ≈ 4.348 — real calendar weeks per month
  const totalWeeks = Math.round(p.horizonMonths * WEEKS_PER_MONTH);
  const SECONDS_PER_WEEK = 7 * 86400;

  // Pre-compute the week number at which each calendar month ends.
  // Months have unequal week counts (4 or 5) so this drives the emit trigger instead of week % 4.
  const monthEndWeek = Array.from(
    { length: p.horizonMonths },
    (_, i) => Math.round((i + 1) * WEEKS_PER_MONTH),
  );
  let nextMonthIdx = 0;

  // Validate / normalise starting state
  let lockedGNET = Math.max(0, p.startLockedGNET);
  let daysLeft = clamp(roundToWeek(Math.max(0, p.startDaysLeft)), 0, 730);
  const relockDays = clamp(roundToWeek(Math.max(7, p.relockDays)), 7, 730);
  const initialOtherRep = Math.max(0, p.initialPoolTotalRep - p.userActualReputation);

  // ── Precompute per-week pool decay from actual lock expiries ──────────────
  // Each week: simulate every pool user's veGNET using their real lockEnd timestamp.
  // This is the deterministic floor — no assumptions about future behaviour.
  const rawDecayByWeek: number[] = [];
  for (let w = 0; w <= totalWeeks; w++) {
    const weekTs = p.snapshotTs + w * SECONDS_PER_WEEK;
    let rep = 0;
    for (const u of p.poolUsers) {
      const secsLeft = Math.max(0, u.lockEnd - weekTs);
      if (secsLeft > 0 && u.lockedGNET > 0) {
        const veGNET = u.lockedGNET * (secsLeft / 86400 / 730);
        rep += calcReputation(u.soulScore, veGNET);
      }
    }
    rawDecayByWeek.push(rep);
  }
  // Scale so week-0 matches chain-accurate initialOtherRep (removes seconds-vs-days drift).
  const decayScale = rawDecayByWeek[0] > 0 ? initialOtherRep / rawDecayByWeek[0] : 1;
  const decayByWeek = rawDecayByWeek.map(r => r * decayScale);

  // Growth extras — rep added on top of decay from new entrants / re-lockers.
  // growthPct = 0 → extras = 0 → three scenarios collapse to pure decay.
  const growthNeutral = p.poolGrowthPctPerMonth / 100;
  const growthPess    = (p.poolGrowthPctPerMonth + p.spreadPct) / 100; // more activity → worse for user
  const growthOpt     = (p.poolGrowthPctPerMonth - p.spreadPct) / 100; // less activity → better (can be negative)

  // Weekly emission calibrated to real calendar: 52.18 weeks/year → correct annual total.
  const WEEKLY_EMISSION = MONTHLY_EMISSION / WEEKS_PER_MONTH;

  const results: ProjectionPoint[] = [];

  // Accumulators reset at each calendar month boundary
  let acc_pess = 0, acc_neutral = 0, acc_opt = 0;

  // Emit the week-0 "Now" snapshot.
  // rep uses userActualReputation from chain (exact), so pool = totalRep exactly
  // and gUBI = real current monthly reward, not 0.
  {
    const veGNET = lockedGNET > 0 ? lockedGNET * (daysLeft / 730) : 0;
    const nowRep = p.userActualReputation; // real chain value, not re-derived from slider
    // At month=0 all scenarios share the same pool (no growth yet)
    const nowPool = initialOtherRep + nowRep; // = p.initialPoolTotalRep exactly
    const nowShare = nowPool > 0 ? nowRep / nowPool : 0;
    const nowGubi = nowShare * MONTHLY_EMISSION;
    results.push({
      week: 0, month: 0, monthLabel: "Now",
      veGNET,
      reputation: nowRep,
      otherRep_pess: initialOtherRep, otherRep_neutral: initialOtherRep, otherRep_opt: initialOtherRep,
      poolRep_pess: nowPool, poolRep_neutral: nowPool, poolRep_opt: nowPool,
      share_pess: nowShare, share_neutral: nowShare, share_opt: nowShare,
      gubi_pess: nowGubi, gubi_neutral: nowGubi, gubi_opt: nowGubi,
    });
  }

  for (let week = 1; week <= totalWeeks; week++) {
    // --- Advance time first so week-N metrics reflect N weeks of decay ---
    daysLeft = Math.max(0, daysLeft - 7);
    if (daysLeft === 0 && p.relockExpired && lockedGNET > 0) {
      daysLeft = relockDays;
    }

    // --- Contributions & lock extensions ---
    if (p.addFrequencyWeeks > 0 && week % p.addFrequencyWeeks === 0) {
      if (p.addGNET > 0) {
        lockedGNET += p.addGNET;
      }
      if (p.extendOnAdd) {
        const newDays = clamp(relockDays, daysLeft, 730);
        daysLeft = Math.max(daysLeft, newDays);
      }
    }

    // --- Compute metrics ---
    const veGNET = lockedGNET > 0 ? lockedGNET * (daysLeft / 730) : 0;
    const reputation = calcReputation(p.soulScore, veGNET);

    // Pool competition = exact decay + extra growth from new entrants / re-lockers.
    // Extra uses fractional month so within-month pool evolution is captured.
    const fractionalMonth = week / WEEKS_PER_MONTH;
    const extra_neutral = initialOtherRep * (Math.pow(1 + growthNeutral, fractionalMonth) - 1);
    const extra_pess    = initialOtherRep * (Math.pow(1 + growthPess,    fractionalMonth) - 1);
    const extra_opt     = initialOtherRep * (Math.pow(1 + growthOpt,     fractionalMonth) - 1);
    const otherRep_neutral = Math.max(0, decayByWeek[week] + extra_neutral);
    const otherRep_pess    = Math.max(0, decayByWeek[week] + extra_pess);
    const otherRep_opt     = Math.max(0, decayByWeek[week] + extra_opt);
    const poolRep_neutral = otherRep_neutral + reputation;
    const poolRep_pess    = otherRep_pess + reputation;
    const poolRep_opt     = otherRep_opt + reputation;

    // Accumulate weekly gUBI slice (1/4 of monthly emission)
    acc_pess    += poolRep_pess    > 0 ? (reputation / poolRep_pess)    * WEEKLY_EMISSION : 0;
    acc_neutral += poolRep_neutral > 0 ? (reputation / poolRep_neutral) * WEEKLY_EMISSION : 0;
    acc_opt     += poolRep_opt     > 0 ? (reputation / poolRep_opt)     * WEEKLY_EMISSION : 0;

    // Emit one data point at each calendar month boundary
    if (nextMonthIdx < monthEndWeek.length && week === monthEndWeek[nextMonthIdx]) {
      const month = nextMonthIdx + 1;
      nextMonthIdx++;
      const share_pess    = poolRep_pess    > 0 ? reputation / poolRep_pess    : 0;
      const share_neutral = poolRep_neutral > 0 ? reputation / poolRep_neutral : 0;
      const share_opt     = poolRep_opt     > 0 ? reputation / poolRep_opt     : 0;
      results.push({
        week, month,
        monthLabel: `M${month}`,
        veGNET, reputation,
        otherRep_pess, otherRep_neutral, otherRep_opt,
        poolRep_pess, poolRep_neutral, poolRep_opt,
        share_pess, share_neutral, share_opt,
        // gUBI = accumulated sum of 4 weekly slices, representing earned gUBI that month
        gubi_pess: acc_pess,
        gubi_neutral: acc_neutral,
        gubi_opt: acc_opt,
      });
      acc_pess = 0; acc_neutral = 0; acc_opt = 0;
    }
  }

  return results;
}
