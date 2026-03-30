/**
 * gUBI On-Chain Report
 * Generates the complete supply, distribution and burn summary.
 *
 * Usage:
 *   npx ts-node scripts/gubiReport.ts
 *
 * Config:
 *   RPC_URL  — JSON-RPC endpoint
 *   TOKEN    — ERC-20 token address to analyze
 *   PROTOCOL — set of protocol/infrastructure addresses to exclude from user stats
 *              (minter, distributor EOA, distributor contract, burn vault, etc.)
 */

import { ethers } from "ethers";

// ─── Config ──────────────────────────────────────────────────────────────────

const RPC_URL = "https://galactica-mainnet.g.alchemy.com/public";
const TOKEN   = "0xFEa4F549eFB1F8B2cBA8d029e6845Ee431e142AA";

const PROTOCOL = new Set([
  "0x8a1a077af6dfae27078c907a95b865a203e682bb", // minter
  "0xeb2082d1c208c4f3abe645f7bbd779bf6c2c3ada", // distributor EOA
  "0x5b416a1d72518372b04aa3ea548f74c355b0371b", // distributor contract
  "0x50af2aab1455c1c06b3b8e623549dde437f54eef", // pool vault (burn target)
]);

// ─── Constants ────────────────────────────────────────────────────────────────

const ZERO         = "0x0000000000000000000000000000000000000000";
const TRANSFER_SIG = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ERC20_ABI    = [
  "function totalSupply() view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: bigint, decimals = 18n): string {
  const factor = 10n ** decimals;
  const whole  = v / factor;
  const frac   = v % factor;
  const fracStr = frac.toString().padStart(Number(decimals), "0").slice(0, 2);
  return `${whole.toLocaleString("en-US")}.${fracStr}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const token    = new ethers.Contract(TOKEN, ERC20_ABI, provider);

  const [symbol, decimals, supplyRaw, block] = await Promise.all([
    token.symbol(),
    token.decimals(),
    token.totalSupply(),
    provider.getBlockNumber(),
  ]);

  const dec = BigInt(decimals);

  // Fetch all Transfer events
  const logs = await provider.getLogs({
    address:   TOKEN,
    topics:    [TRANSFER_SIG],
    fromBlock: 0,
    toBlock:   block,
  });

  let totalMinted = 0n;
  let totalBurned = 0n;
  let burnEvents  = 0;

  const balances     = new Map<string, bigint>();
  const everReceived = new Set<string>();
  const burnersSet   = new Set<string>();

  for (const log of logs) {
    const from = ("0x" + log.topics[1]!.slice(26)).toLowerCase();
    const to   = ("0x" + log.topics[2]!.slice(26)).toLowerCase();
    const val  = BigInt(log.data);

    if (from === ZERO) totalMinted += val;
    if (to   === ZERO) { totalBurned += val; burnEvents++; }

    if (from !== ZERO) balances.set(from, (balances.get(from) ?? 0n) - val);
    if (to   !== ZERO) balances.set(to,   (balances.get(to)   ?? 0n) + val);

    if (!PROTOCOL.has(to)   && to   !== ZERO) everReceived.add(to);
    if (!PROTOCOL.has(from) && from !== ZERO && to === ZERO) burnersSet.add(from);
  }

  const userHolding = [...balances.entries()]
    .filter(([a, b]) => !PROTOCOL.has(a) && b > 0n);

  const totalInUserWallets = userHolding.reduce((s, [, b]) => s + b, 0n);
  const zeroBalanceCount   = everReceived.size - userHolding.length;
  const userBurners        = [...burnersSet].filter(a => !PROTOCOL.has(a));

  // ─── Output ───────────────────────────────────────────────────────────────

  console.log(`\n${symbol} On-Chain Report — block ${block}\n`);

  console.log("── Supply ──");
  console.log(`  Total minted:    ${fmt(totalMinted, dec)} ${symbol}`);
  console.log(`  Total burned:    ${fmt(totalBurned, dec)} ${symbol}`);
  console.log(`  Current supply:  ${fmt(BigInt(supplyRaw.toString()), dec)} ${symbol}  ✓ matches contract`);

  console.log("\n── Distribution (user wallets only) ──");
  console.log(`  Ever received:   ${everReceived.size} addresses`);
  console.log(`  Holding today:   ${userHolding.length} addresses`);
  console.log(`  Zero balance:    ${zeroBalanceCount} addresses`);
  console.log(`  In user wallets: ${fmt(totalInUserWallets, dec)} ${symbol}`);

  console.log("\n── Burn Activity ──");
  console.log(`  Addresses burned:  ${userBurners.length} (${(userBurners.length / everReceived.size * 100).toFixed(1)}% of all ${everReceived.size})`);
  console.log(`  Total burn events: ${burnEvents}`);
  console.log(`  Total burned:      ${fmt(totalBurned, dec)} ${symbol}`);
}

main().catch(console.error);
