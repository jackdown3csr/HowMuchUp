import { MONTHLY_EMISSION } from "./constants";
import { calcReputation } from "./utils";

export interface LabParams {
  startLockedGNET: number;
  startDaysLeft: number;       // must be multiple of 7
  soulScore: number;
  addGNET: number;             // GNET added per contribution
  addFrequencyWeeks: number;   // 1 | 2 | 4
  extendOnAdd: boolean;        // also extend lock when adding
  relockDays: number;          // days to set when extending / re-locking (rounded to week)
  relockExpired: boolean;      // auto-relock when lock reaches 0
  horizonMonths: number;       // 3 | 6 | 12 | 24
  poolGrowthPctPerMonth: number; // neutral monthly pool growth %
  spreadPct: number;           // pess = neutral - spread, opt = neutral + spread
  initialPoolTotalRep: number;
}

export interface ProjectionPoint {
  week: number;
  monthLabel: string;
  veGNET: number;
  reputation: number;
  gubi_pess: number;
  gubi_neutral: number;
  gubi_opt: number;
}

function roundToWeek(days: number): number {
  return Math.round(days / 7) * 7;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Pure math projection engine.
 * Mirrors real VotingEscrow: one lock per address.
 * Weekly ticks; output sampled every 4 weeks (≈ 1 point/month).
 */
export function projectGUBI(p: LabParams): ProjectionPoint[] {
  const totalWeeks = p.horizonMonths * 4; // approximate

  // Validate / normalise starting state
  let lockedGNET = Math.max(0, p.startLockedGNET);
  let daysLeft = clamp(roundToWeek(Math.max(0, p.startDaysLeft)), 0, 730);
  const relockDays = clamp(roundToWeek(Math.max(7, p.relockDays)), 7, 730);

  const growthNeutral = p.poolGrowthPctPerMonth / 100;
  const growthPess = (p.poolGrowthPctPerMonth + p.spreadPct) / 100; // pool grows faster → user share smaller
  const growthOpt = Math.max(0, (p.poolGrowthPctPerMonth - p.spreadPct) / 100); // pool grows slower → user share bigger

  const results: ProjectionPoint[] = [];

  for (let week = 0; week <= totalWeeks; week++) {
    // --- Contributions & lock extensions ---
    if (week > 0 && p.addFrequencyWeeks > 0 && week % p.addFrequencyWeeks === 0) {
      if (p.addGNET > 0) {
        lockedGNET += p.addGNET;
      }
      if (p.extendOnAdd && p.addGNET > 0) {
        // increase_unlock_time: new lockEnd = now + relockDays, but capped at max 730 from now
        const newDays = clamp(relockDays, daysLeft, 730);
        daysLeft = Math.max(daysLeft, newDays);
      }
    }

    // --- Compute metrics at this point ---
    const veGNET = lockedGNET > 0 ? lockedGNET * (daysLeft / 730) : 0;
    const reputation = calcReputation(p.soulScore, veGNET);

    // Sample every 4 weeks (≈ monthly) + week 0
    if (week % 4 === 0) {
      const month = Math.round(week / 4);
      // Use integer month for pool growth — ensures clean monthly compounding at each data point
      const poolRep_neutral = p.initialPoolTotalRep * Math.pow(1 + growthNeutral, month);
      const poolRep_pess    = p.initialPoolTotalRep * Math.pow(1 + growthPess,    month);
      const poolRep_opt     = p.initialPoolTotalRep * Math.pow(1 + growthOpt,     month);
      const share = (pool: number) => pool > 0 ? reputation / pool : 0;
      results.push({
        week,
        monthLabel: month === 0 ? "Now" : `M${month}`,
        veGNET,
        reputation,
        gubi_pess:    share(poolRep_pess)    * MONTHLY_EMISSION,
        gubi_neutral: share(poolRep_neutral) * MONTHLY_EMISSION,
        gubi_opt:     share(poolRep_opt)     * MONTHLY_EMISSION,
      });
    }

    // --- Advance time ---
    daysLeft = Math.max(0, daysLeft - 7);

    // Re-lock expired
    if (daysLeft === 0 && p.relockExpired && lockedGNET > 0) {
      daysLeft = relockDays;
    }
  }

  return results;
}
