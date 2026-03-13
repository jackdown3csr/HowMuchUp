import type { LeaderboardItem, LeaderboardResponse, UserData, StatsData, PoolData } from "./types";
import { API_BASE, CHAIN_ID } from "./constants";

async function apiFetch<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${API_BASE}${path}${sep}chainId=${CHAIN_ID}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchAllLeaderboard(): Promise<LeaderboardItem[]> {
  const limit = 100;
  let offset = 0;
  const all: LeaderboardItem[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const data = await apiFetch<LeaderboardResponse>(`/leaderboard?offset=${offset}&limit=${limit}`);
    all.push(...data.items);
    if (all.length >= data.total || data.items.length < limit) break;
    offset += limit;
  }
  return all;
}

export async function fetchUser(address: string): Promise<UserData> {
  return apiFetch<UserData>(`/user/${address}`);
}

export async function fetchStats(): Promise<StatsData> {
  return apiFetch<StatsData>("/stats");
}

export async function fetchPool(): Promise<PoolData> {
  return apiFetch<PoolData>("/pool");
}

/**
 * Fetch user data in parallel batches.
 */
export async function fetchUsersInBatches(
  addresses: string[],
  batchSize = 10,
): Promise<Map<string, UserData>> {
  const map = new Map<string, UserData>();
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map((a) => fetchUser(a)));
    results.forEach((r, idx) => {
      if (r.status === "fulfilled") {
        map.set(batch[idx].toLowerCase(), r.value);
      }
    });
  }
  return map;
}
