import type { EnrichedUser, SimulationResult } from "./types";
import { MONTHLY_EMISSION } from "./constants";
import { calcReputation } from "./utils";

export function simulate(
  user: EnrichedUser,
  allUsers: EnrichedUser[],
  additionalGNET: number,
  extensionDays: number,
  extraSoul: number,
): SimulationResult {
  const now = Math.floor(Date.now() / 1000);
  const hasChanges = additionalGNET > 0 || extensionDays > 0 || extraSoul > 0;

  // Current derived values
  const currentLockedGNET = user.lockedGNET;
  const currentVeGNET = user.veGNET; // on-chain balanceOf
  const currentDaysLeft = user.lockEnd > now ? Math.floor((user.lockEnd - now) / 86400) : 0;
  const currentSoulScore = user.soulScore;
  const currentReputation = user.reputation;

  // Simulated values — exact current state for no-op, formula mode for actual edits.
  const simLockedGNET = currentLockedGNET + additionalGNET;
  const simDaysLeft = Math.min(currentDaysLeft + extensionDays, 730);
  const simSoulScore = currentSoulScore + extraSoul;
  const simVeGNET = hasChanges ? simLockedGNET * (simDaysLeft / 730) : currentVeGNET;
  const simReputation = hasChanges ? calcReputation(simSoulScore, simVeGNET) : currentReputation;

  // Current rank: count users with higher rep than current user
  const currentRank = allUsers.filter(
    (u) => u.address.toLowerCase() !== user.address.toLowerCase() && u.reputation > currentReputation
  ).length + 1;

  // Simulated rank: count users with higher rep than simulated rep (excluding self)
  const simRank = hasChanges
    ? allUsers.filter(
        (u) => u.address.toLowerCase() !== user.address.toLowerCase() && u.reputation > simReputation
      ).length + 1
    : currentRank;

  // total reputation of all users (excluding self, using real values)
  const totalRepOthers = allUsers
    .filter((u) => u.address.toLowerCase() !== user.address.toLowerCase())
    .reduce((s, u) => s + u.reputation, 0);

  const currentTotalRep = totalRepOthers + currentReputation;
  const simTotalRep = totalRepOthers + simReputation;

  const currentMonthlyReward = currentTotalRep > 0 ? (currentReputation / currentTotalRep) * MONTHLY_EMISSION : 0;
  const simMonthlyReward = hasChanges
    ? (simTotalRep > 0 ? (simReputation / simTotalRep) * MONTHLY_EMISSION : 0)
    : currentMonthlyReward;

  return {
    currentLockedGNET,
    currentVeGNET,
    currentDaysLeft,
    currentSoulScore,
    currentReputation,
    currentRank,
    currentMonthlyReward,
    simLockedGNET,
    simVeGNET,
    simDaysLeft,
    simSoulScore,
    simReputation,
    simRank,
    simMonthlyReward,
    deltaRank: currentRank - simRank,
    deltaReward: simMonthlyReward - currentMonthlyReward,
  };
}
