import { ethers } from "ethers";
import { RPC_URL, CONTRACTS, VOTING_ESCROW_ABI, ERC20_ABI, GUBI_PROTOCOL_ADDRESSES } from "./constants";

let _provider: ethers.JsonRpcProvider | null = null;

export function getProvider(): ethers.JsonRpcProvider {
  if (!_provider) {
    _provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return _provider;
}

export async function getCurrentBlock(): Promise<number> {
  return getProvider().getBlockNumber();
}

function getVeGNETContract(): ethers.Contract {
  return new ethers.Contract(CONTRACTS.veGNET, VOTING_ESCROW_ABI, getProvider());
}

function getGubiTokenContract(): ethers.Contract {
  return new ethers.Contract(CONTRACTS.gubiToken, ERC20_ABI, getProvider());
}

export async function readMaxTime(): Promise<number> {
  const c = getVeGNETContract();
  const val: bigint = await c.MAXTIME();
  return Number(val);
}

export interface LockData {
  locked: number;
  lockEnd: number;
  balanceOf: number;
}

export async function readLockData(address: string, blockTag?: number): Promise<LockData> {
  const c = getVeGNETContract();
  const overrides = blockTag !== undefined ? { blockTag } : {};
  const [locked, lockEnd, bal] = await Promise.all([
    c.locked(address, overrides) as Promise<bigint>,
    c.lockEnd(address, overrides) as Promise<bigint>,
    c.balanceOf(address, overrides) as Promise<bigint>,
  ]);
  return {
    locked: Number(ethers.formatEther(locked)),
    lockEnd: Number(lockEnd),
    balanceOf: Number(ethers.formatEther(bal)),
  };
}

export async function readLockDataBatch(
  addresses: string[],
  batchSize = 10,
  blockTag?: number,
): Promise<Map<string, LockData>> {
  const map = new Map<string, LockData>();
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    const results = await Promise.allSettled(batch.map((a) => readLockData(a, blockTag)));
    results.forEach((r, idx) => {
      if (r.status === "fulfilled") {
        map.set(batch[idx].toLowerCase(), r.value);
      }
    });
  }
  return map;
}

export async function readGubiTotalSupply(): Promise<number> {
  const c = getGubiTokenContract();
  const val: bigint = await c.totalSupply();
  return Number(ethers.formatEther(val));
}

const TRANSFER_SIG = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO_TOPIC   = "0x" + "0".repeat(64);

export interface GubiBurnStats {
  totalBurned: number;
  burnEvents: number;
  uniqueBurners: number;
}

export async function readGubiBurnStats(): Promise<GubiBurnStats> {
  const provider = getProvider();
  const block = await provider.getBlockNumber();

  const logs = await provider.getLogs({
    address:   CONTRACTS.gubiToken,
    topics:    [TRANSFER_SIG, null, ZERO_TOPIC],
    fromBlock: 0,
    toBlock:   block,
  });

  let totalBurned = 0n;
  const burners = new Set<string>();

  for (const log of logs) {
    const from = ("0x" + log.topics[1]!.slice(26)).toLowerCase();
    totalBurned += BigInt(log.data);
    if (!GUBI_PROTOCOL_ADDRESSES.has(from)) {
      burners.add(from);
    }
  }

  return {
    totalBurned:   Number(ethers.formatEther(totalBurned)),
    burnEvents:    logs.length,
    uniqueBurners: burners.size,
  };
}
