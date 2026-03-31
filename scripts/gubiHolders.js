import { writeFileSync } from "node:fs";
import { ethers } from "ethers";

const RPC_URL = process.env.RPC_URL ?? "https://galactica-mainnet.g.alchemy.com/public";
const TOKEN = process.env.TOKEN ?? "0xFEa4F549eFB1F8B2cBA8d029e6845Ee431e142AA";
const BLOCK_STEP = Number(process.env.BLOCK_STEP ?? 50_000);

const ZERO = "0x0000000000000000000000000000000000000000";
const TRANSFER_SIG = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

const PROTOCOL = new Set([
  "0x8a1a077af6dfae27078c907a95b865a203e682bb",
  "0xeb2082d1c208c4f3abe645f7bbd779bf6c2c3ada",
  "0x5b416a1d72518372b04aa3ea548f74c355b0371b",
  "0x50af2aab1455c1c06b3b8e623549dde437f54eef",
]);

function printHelp() {
  console.log(`gUBI holders export

Usage:
  npm run holders:gubi -- [--json|--csv] [--out holders.json] [--min 1] [--user-only]
  node scripts/gubiHolders.js --json --out holders.json

Options:
  --json       Output JSON with summary + holders array
  --csv        Output CSV
  --out PATH   Write the result to a file instead of stdout
  --min VALUE  Only include holders with at least VALUE tokens
  --user-only  Exclude known protocol/infrastructure addresses
  --help       Show this help

Environment:
  RPC_URL      Override JSON-RPC endpoint
  TOKEN        Override ERC-20 contract
  BLOCK_STEP   Log query chunk size (default: 50000)
`);
}

function getArgValue(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function csvEscape(value) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
}

function formatTokenAmount(value, decimals) {
  return ethers.formatUnits(value, decimals);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    printHelp();
    return;
  }

  const asJson = args.includes("--json");
  const asCsv = args.includes("--csv");
  if (asJson && asCsv) {
    throw new Error("Use either --json or --csv, not both.");
  }

  const outPath = getArgValue(args, "--out");
  const minArg = getArgValue(args, "--min") ?? "0";
  const userOnly = args.includes("--user-only");

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const token = new ethers.Contract(
    TOKEN,
    [
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)",
    ],
    provider,
  );

  const [symbol, decimals, totalSupply, latestBlock] = await Promise.all([
    token.symbol(),
    token.decimals(),
    token.totalSupply(),
    provider.getBlockNumber(),
  ]);

  const minRaw = ethers.parseUnits(minArg, decimals);
  const balances = new Map();

  for (let fromBlock = 0; fromBlock <= latestBlock; fromBlock += BLOCK_STEP) {
    const toBlock = Math.min(fromBlock + BLOCK_STEP - 1, latestBlock);
    console.error(`Fetching Transfer logs ${fromBlock}-${toBlock}...`);

    const logs = await provider.getLogs({
      address: TOKEN,
      topics: [TRANSFER_SIG],
      fromBlock,
      toBlock,
    });

    for (const log of logs) {
      const from = ("0x" + log.topics[1].slice(26)).toLowerCase();
      const to = ("0x" + log.topics[2].slice(26)).toLowerCase();
      const value = BigInt(log.data);

      if (from !== ZERO) balances.set(from, (balances.get(from) ?? 0n) - value);
      if (to !== ZERO) balances.set(to, (balances.get(to) ?? 0n) + value);
    }
  }

  const holders = [...balances.entries()]
    .filter(([address, balance]) => balance > 0n && balance >= minRaw && (!userOnly || !PROTOCOL.has(address)))
    .sort((a, b) => (a[1] === b[1] ? a[0].localeCompare(b[0]) : b[1] > a[1] ? 1 : -1))
    .map(([address, balance], index) => ({
      rank: index + 1,
      address,
      balance: formatTokenAmount(balance, decimals),
    }));

  const heldRaw = holders.reduce((sum, holder) => sum + ethers.parseUnits(holder.balance, decimals), 0n);
  const payload = {
    token: TOKEN,
    symbol,
    block: latestBlock,
    totalSupply: formatTokenAmount(totalSupply, decimals),
    holderCount: holders.length,
    totalHeldByListed: formatTokenAmount(heldRaw, decimals),
    filters: {
      min: minArg,
      userOnly,
    },
    holders,
  };

  let output;
  if (asJson) {
    output = JSON.stringify(payload, null, 2);
  } else if (asCsv) {
    const lines = [
      "rank,address,balance",
      ...holders.map((holder) => [holder.rank, holder.address, holder.balance].map(csvEscape).join(",")),
    ];
    output = lines.join("\n");
  } else {
    const lines = [
      `${symbol} holders at block ${latestBlock}`,
      `Token: ${TOKEN}`,
      `Total supply: ${payload.totalSupply}`,
      `Holder count: ${payload.holderCount}`,
      `Listed total: ${payload.totalHeldByListed}`,
      "",
      ...holders.map((holder) => `${holder.rank}. ${holder.address} ${holder.balance}`),
    ];
    output = lines.join("\n");
  }

  if (outPath) {
    writeFileSync(outPath, output + "\n", "utf8");
    console.error(`Wrote ${holders.length} holders to ${outPath}`);
  } else {
    console.log(output);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
