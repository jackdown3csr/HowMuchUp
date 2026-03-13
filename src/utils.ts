/**
 * Parse the veGNET JSON string from /user API.
 * Format: {"0xdfbe...":"44235.89"} — take the first value.
 */
export function parseVeGNET(raw: string): number {
  if (!raw) return 0;
  try {
    const obj = JSON.parse(raw);
    const vals = Object.values(obj) as string[];
    if (vals.length === 0) return 0;
    return parseFloat(vals[0]) || 0;
  } catch {
    return 0;
  }
}

export function shortAddr(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(ts: number): string {
  if (ts <= 0) return "—";
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Week rounding used by VotingEscrow */
const WEEK = 7 * 86400;
export function roundToWeek(ts: number): number {
  return Math.floor(ts / WEEK) * WEEK;
}

/** veGNET = lockedGNET × (daysRemaining / 730) */
export function calcVeGNET(lockedGNET: number, lockEndTs: number, nowTs?: number): number {
  const now = nowTs ?? Math.floor(Date.now() / 1000);
  const remaining = Math.max(0, lockEndTs - now);
  const daysRemaining = remaining / 86400;
  return lockedGNET * (daysRemaining / 730);
}

/** reputation = soulScore × log10(veGNET), floored at 0 (veGNET < 1 → rep = 0) */
export function calcReputation(soulScore: number, veGNET: number): number {
  if (veGNET < 1) return 0;
  return soulScore * Math.log10(veGNET);
}

/** monthly_reward = (reputation / totalReputation) × emission */
export function calcMonthlyReward(
  reputation: number,
  totalReputation: number,
  emission: number,
): number {
  if (totalReputation <= 0) return 0;
  return (reputation / totalReputation) * emission;
}

/** Rank users by reputation descending, return 1-based rank of the target. */
export function computeRank(
  allReputations: { address: string; reputation: number }[],
  targetAddress: string,
): number {
  const sorted = [...allReputations].sort((a, b) => b.reputation - a.reputation);
  const idx = sorted.findIndex((u) => u.address.toLowerCase() === targetAddress.toLowerCase());
  return idx === -1 ? -1 : idx + 1;
}
