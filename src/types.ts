export interface LeaderboardItem {
  address: string;
  rank: number;
  points: number;
  reputation: number;
  gubiAccrued: number;
  pool: string;
}

export interface LeaderboardResponse {
  items: LeaderboardItem[];
  total: number;
}

export interface UserData {
  rank: number;
  points: number;
  soulScore: number;
  reputation: number;
  veGNET: string; // JSON string like {"0xdfbe...":"44235.89"}
  share: number;
  monthlyReward: number;
  totalEarnings: number;
  alreadyClaimed: number;
}

export interface StatsData {
  totalReputation: number;
  totalMonthlyEmission: string;
  dailyDistribution: string;
  emissionPerRepPoint: number;
  totalUsers: number;
}

export interface PoolData {
  totalWorthUSD: number;
  gubiPrice: number;
  supply: number;
  composition: Array<{
    address: string;
    symbol: string;
    balance: number;
    priceUSD: number;
    valueUSD: number;
  }>;
}

export interface EnrichedUser {
  address: string;
  rank: number;
  points: number;
  soulScore: number;
  reputation: number;
  veGNET: number;
  lockedGNET: number;
  lockEnd: number; // unix timestamp
  balanceOfVeGNET: number;
  monthlyReward: number;
  totalEarnings: number;
  alreadyClaimed: number;
  share: number;
}

export interface SimulationResult {
  hasChanges: boolean;
  currentLockedGNET: number;
  currentVeGNET: number;
  currentDaysLeft: number;
  currentSoulScore: number;
  currentReputation: number;
  currentRank: number;
  currentMonthlyReward: number;
  simLockedGNET: number;
  simVeGNET: number;
  simDaysLeft: number;
  simSoulScore: number;
  simReputation: number;
  simRank: number;
  simMonthlyReward: number;
  deltaRank: number;
  deltaReward: number;
}
