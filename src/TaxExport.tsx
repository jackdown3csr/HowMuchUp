import { useState, useRef } from "react";
import { ethers } from "ethers";
import { RPC_URL, CONTRACTS } from "./constants";
import { type Lang, translations } from "./i18n";

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
  padding: "3px 8px",
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
const btnDim: React.CSSProperties = {
  ...btnStyle,
  borderColor: C.borderAccent,
  color: C.textDim,
};

// ── constants ─────────────────────────────────────────────────────────────────

const EXPLORER_API = "https://explorer.galactica.com/api";
const BLOCK_STEP = 50_000;

const GUBI_DISTRIBUTORS = new Set([
  "0xeb2082d1c208c4f3abe645f7bbd779bf6c2c3ada",
  "0x5b416a1d72518372b04aa3ea548f74c355b0371b",
  "0x07297e1aa709c85e81c1a9498080ae010be91d80",
]);
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

const SIG_TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const SIG_DEPOSIT  = ethers.id("Deposit(address,uint256,uint256,int128,uint256)");
const SIG_WITHDRAW = ethers.id("Withdraw(address,uint256,uint256)");

// Legacy staking contract (TransparentUpgradeableProxy of Staking.sol)
const STAKING_CONTRACT     = "0x90b07e15cfb173726de904ca548dd96f73c12428";
// RewardDistributor — merkle-based GNET vesting (TransparentUpgradeableProxy)
const REWARD_DIST_CONTRACT = "0x80BCB71F63f11344F5483d108374fa394A587AbE";

const SIG_CREATE_STAKE = ethers.id("CreateStake(address,uint256)");
const SIG_REMOVE_STAKE = ethers.id("RemoveStake(address,uint256)");
const SIG_REWARD_PAID  = ethers.id("RewardPaid(address,uint256)");
const SIG_EXTRA_REWARD = ethers.id("ExtraRewardProvided(address,uint256)");
// ClaimReward(bytes32 merkleRoot, address sendToAddress, address account, uint256 leafIndex, uint256 amount)
const SIG_CLAIM_REWARD = ethers.id("ClaimReward(bytes32,address,address,uint256,uint256)");

// ── helpers ───────────────────────────────────────────────────────────────────

function toKoinlyDate(ts: number) {
  return new Date(ts * 1000).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}
function fmtToken(v: bigint, decimals = 18) {
  return ethers.formatUnits(v, decimals);
}
function addrTopic(address: string) {
  return "0x" + address.toLowerCase().replace("0x", "").padStart(64, "0");
}
function csvEscape(v: unknown) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

interface CsvRow {
  date: string;
  sentAmount: string;
  sentCurrency: string;
  receivedAmount: string;
  receivedCurrency: string;
  feeAmount: string;
  feeCurrency: string;
  netWorthAmount: string;
  netWorthCurrency: string;
  label: string;
  description: string;
  txHash: string;
}
const CSV_HEADER = "Date,Sent Amount,Sent Currency,Received Amount,Received Currency,Fee Amount,Fee Currency,Net Worth Amount,Net Worth Currency,Label,Description,TxHash";

function makeRow(r: Partial<CsvRow>) {
  const cols: (keyof CsvRow)[] = [
    "date","sentAmount","sentCurrency","receivedAmount","receivedCurrency",
    "feeAmount","feeCurrency","netWorthAmount","netWorthCurrency","label","description","txHash",
  ];
  return cols.map(k => csvEscape(r[k] ?? "")).join(",");
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── block timestamp cache ─────────────────────────────────────────────────────

const blockTsCache = new Map<number, number>();

async function blockTs(provider: ethers.JsonRpcProvider, blockNumber: number): Promise<number> {
  if (blockTsCache.has(blockNumber)) return blockTsCache.get(blockNumber)!;
  const block = await provider.getBlock(blockNumber);
  const ts = block?.timestamp ?? 0;
  blockTsCache.set(blockNumber, ts);
  return ts;
}

async function findBlockAtTs(provider: ethers.JsonRpcProvider, targetTs: number, lo: number, hi: number): Promise<number> {
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const ts = await blockTs(provider, mid);
    if (ts < targetTs) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

async function getLogsChunked(
  provider: ethers.JsonRpcProvider,
  filter: ethers.Filter,
  fromBlock: number,
  toBlock: number,
  onProgress: (msg: string) => void,
) {
  const logs: ethers.Log[] = [];
  for (let from = fromBlock; from <= toBlock; from += BLOCK_STEP) {
    const to = Math.min(from + BLOCK_STEP - 1, toBlock);
    onProgress(`blocks ${from.toLocaleString()}–${to.toLocaleString()}…`);
    const chunk = await provider.getLogs({ ...filter, fromBlock: from, toBlock: to });
    logs.push(...chunk);
  }
  return logs;
}

const gasByTx = new Map<string, { gasUsed: bigint; gasPrice: bigint; from: string }>();
async function getGasInfo(provider: ethers.JsonRpcProvider, txHash: string) {
  if (gasByTx.has(txHash)) return gasByTx.get(txHash)!;
  const receipt = await provider.getTransactionReceipt(txHash);
  const info = {
    gasUsed:  receipt?.gasUsed  ?? 0n,
    gasPrice: receipt?.gasPrice ?? 0n,
    from:     receipt?.from?.toLowerCase() ?? "",
  };
  gasByTx.set(txHash, info);
  return info;
}

// ── export logic ──────────────────────────────────────────────────────────────

interface ExportRow { ts: number; row: Partial<CsvRow> }

async function runExport(
  wallet: string,
  fromTs: number,
  toTs: number,
  onProgress: (msg: string) => void,
  signal: AbortSignal,
): Promise<ExportRow[]> {
  const rows: ExportRow[] = [];
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const walletLow = wallet.toLowerCase();

  function checkAbort() {
    if (signal.aborted) throw new Error("Cancelled");
  }

  onProgress("Finding block range…");
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = await findBlockAtTs(provider, fromTs, 0, latestBlock);
  const toBlock   = await findBlockAtTs(provider, toTs,   fromBlock, latestBlock);
  onProgress(`Block range: ${fromBlock.toLocaleString()} → ${toBlock.toLocaleString()}`);
  checkAbort();

  const walletTopic = addrTopic(walletLow);

  // ── 1. Native txns via explorer API ─────────────────────────────────────────
  onProgress("Fetching native GNET transactions…");
  try {
    let page = 1;
    for (;;) {
      checkAbort();
      const url = new URL(EXPLORER_API);
      url.searchParams.set("module",     "account");
      url.searchParams.set("action",     "txlist");
      url.searchParams.set("address",    wallet);
      url.searchParams.set("startblock", String(fromBlock));
      url.searchParams.set("endblock",   String(toBlock));
      url.searchParams.set("sort",       "asc");
      url.searchParams.set("page",       String(page));
      url.searchParams.set("offset",     "1000");

      let data: { status: string; message: string; result: Record<string, string>[] };
      try {
        const res = await fetch(url.toString());
        data = await res.json();
      } catch {
        onProgress("⚠ Explorer API unavailable — native GNET txns skipped (add manually from explorer)");
        break;
      }

      if (data.status === "0" && data.message === "No transactions found") break;
      if (data.status !== "1") {
        onProgress(`⚠ Explorer API: ${data.message} — native GNET txns skipped`);
        break;
      }

      for (const tx of data.result) {
        const ts       = Number(tx.timeStamp);
        const from     = tx.from.toLowerCase();
        const to       = (tx.to ?? "").toLowerCase();
        const value    = BigInt(tx.value ?? "0");
        const gasUsed  = BigInt(tx.gasUsed ?? "0");
        const gasPrice = BigInt(tx.gasPrice ?? "0");
        const fee      = gasUsed * gasPrice;
        const isOut    = from === walletLow;
        const isIn     = to   === walletLow;

        if (tx.isError === "1") {
          if (isOut && fee > 0n) {
            rows.push({ ts, row: { date: toKoinlyDate(ts), feeAmount: fmtToken(fee), feeCurrency: "GNET", label: "cost", description: "Failed tx gas fee", txHash: tx.hash } });
          }
          continue;
        }

        const row: Partial<CsvRow> = { date: toKoinlyDate(ts), txHash: tx.hash };
        if (isOut) { row.feeAmount = fmtToken(fee); row.feeCurrency = "GNET"; }
        if (isOut && value > 0n) { row.sentAmount = fmtToken(value); row.sentCurrency = "GNET"; row.description = `Send GNET to ${tx.to}`; }
        else if (isIn && value > 0n) { row.receivedAmount = fmtToken(value); row.receivedCurrency = "GNET"; row.description = `Receive GNET from ${tx.from}`; }
        rows.push({ ts, row });
      }

      if (data.result.length < 1000) break;
      page++;
    }
  } catch (e: unknown) {
    if ((e as Error).message === "Cancelled") throw e;
    onProgress(`⚠ Native txns error: ${(e as Error).message}`);
  }
  checkAbort();

  // ── 2. gUBI transfers ────────────────────────────────────────────────────────
  onProgress("Fetching gUBI transfers (outgoing)…");
  const gubiOut = await getLogsChunked(provider, { address: CONTRACTS.gubiToken, topics: [SIG_TRANSFER, walletTopic] }, fromBlock, toBlock, onProgress);
  checkAbort();
  onProgress("Fetching gUBI transfers (incoming)…");
  const gubiIn  = await getLogsChunked(provider, { address: CONTRACTS.gubiToken, topics: [SIG_TRANSFER, null, walletTopic] }, fromBlock, toBlock, onProgress);
  checkAbort();

  for (const log of gubiOut) {
    const ts     = await blockTs(provider, log.blockNumber);
    const amount = BigInt(log.data);
    const toAddr = ("0x" + log.topics[2].slice(26)).toLowerCase();
    const gas    = await getGasInfo(provider, log.transactionHash);
    const fee    = gas.from === walletLow ? gas.gasUsed * gas.gasPrice : 0n;
    rows.push({ ts, row: {
      date: toKoinlyDate(ts),
      sentAmount: fmtToken(amount), sentCurrency: "GUBI",
      feeAmount: fee > 0n ? fmtToken(fee) : "", feeCurrency: fee > 0n ? "GNET" : "",
      // Burn: no CSV tag — plain withdrawal is safe default.
      // For write-off set Net Worth to 0, or use label "lost" (jurisdiction-dependent).
      label: "",
      description: toAddr === ZERO_ADDR ? "gUBI burn (sent to zero address)" : `Send GUBI to ${toAddr}`,
      txHash: log.transactionHash,
    }});
  }
  checkAbort();

  for (const log of gubiIn) {
    const ts      = await blockTs(provider, log.blockNumber);
    const amount  = BigInt(log.data);
    const fromAdr = ("0x" + log.topics[1].slice(26)).toLowerCase();
    const isReward = GUBI_DISTRIBUTORS.has(fromAdr) || fromAdr === ZERO_ADDR;
    rows.push({ ts, row: {
      date: toKoinlyDate(ts),
      receivedAmount: fmtToken(amount), receivedCurrency: "GUBI",
      label: isReward ? "reward" : "",
      description: isReward ? "gUBI monthly reward" : `Receive GUBI from ${fromAdr}`,
      txHash: log.transactionHash,
    }});
  }
  checkAbort();

  // ── 3. wGNET transfers ───────────────────────────────────────────────────────
  onProgress("Fetching wGNET transfers…");
  const wgnetOut = await getLogsChunked(provider, { address: CONTRACTS.wgnet, topics: [SIG_TRANSFER, walletTopic] }, fromBlock, toBlock, onProgress);
  const wgnetIn  = await getLogsChunked(provider, { address: CONTRACTS.wgnet, topics: [SIG_TRANSFER, null, walletTopic] }, fromBlock, toBlock, onProgress);
  checkAbort();

  for (const log of wgnetOut) {
    const ts     = await blockTs(provider, log.blockNumber);
    const amount = BigInt(log.data);
    const toAddr = ("0x" + log.topics[2].slice(26)).toLowerCase();
    const gas    = await getGasInfo(provider, log.transactionHash);
    const fee    = gas.from === walletLow ? gas.gasUsed * gas.gasPrice : 0n;
    rows.push({ ts, row: {
      date: toKoinlyDate(ts),
      sentAmount: fmtToken(amount), sentCurrency: "WGNET",
      feeAmount: fee > 0n ? fmtToken(fee) : "", feeCurrency: fee > 0n ? "GNET" : "",
      description: toAddr === ZERO_ADDR ? "wGNET unwrap" : `Send wGNET to ${toAddr}`,
      txHash: log.transactionHash,
    }});
  }
  for (const log of wgnetIn) {
    const ts      = await blockTs(provider, log.blockNumber);
    const amount  = BigInt(log.data);
    const fromAdr = ("0x" + log.topics[1].slice(26)).toLowerCase();
    rows.push({ ts, row: {
      date: toKoinlyDate(ts),
      receivedAmount: fmtToken(amount), receivedCurrency: "WGNET",
      description: fromAdr === ZERO_ADDR ? "wGNET wrap" : `Receive wGNET from ${fromAdr}`,
      txHash: log.transactionHash,
    }});
  }
  checkAbort();

  // ── 4. veGNET Deposit (lock) ─────────────────────────────────────────────────
  onProgress("Fetching veGNET lock events…");
  const depositLogs = await getLogsChunked(provider, { address: CONTRACTS.veGNET, topics: [SIG_DEPOSIT, walletTopic] }, fromBlock, toBlock, onProgress);
  checkAbort();

  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  for (const log of depositLogs) {
    const ts = await blockTs(provider, log.blockNumber);
    let amount = 0n;
    try { amount = abiCoder.decode(["uint256","int128","uint256"], log.data)[0] as bigint; } catch { /* ignore */ }
    const gas      = await getGasInfo(provider, log.transactionHash);
    const fee      = gas.from === walletLow ? gas.gasUsed * gas.gasPrice : 0n;
    const lockEnd  = BigInt(log.topics[2] ?? "0x0");
    const lockDate = lockEnd > 0n ? new Date(Number(lockEnd) * 1000).toISOString().slice(0, 10) : "";
    rows.push({ ts, row: {
      date: toKoinlyDate(ts),
      sentAmount: amount > 0n ? fmtToken(amount) : "", sentCurrency: amount > 0n ? "GNET" : "",
      feeAmount: fee > 0n ? fmtToken(fee) : "", feeCurrency: fee > 0n ? "GNET" : "",
      label: "stake",
      description: `GNET locked in veGNET${lockDate ? ` until ${lockDate}` : ""}`,
      txHash: log.transactionHash,
    }});
  }
  checkAbort();

  // ── 5. veGNET Withdraw (unlock) ──────────────────────────────────────────────
  onProgress("Fetching veGNET unlock events…");
  const withdrawLogs = await getLogsChunked(provider, { address: CONTRACTS.veGNET, topics: [SIG_WITHDRAW, walletTopic] }, fromBlock, toBlock, onProgress);
  checkAbort();

  for (const log of withdrawLogs) {
    const ts = await blockTs(provider, log.blockNumber);
    let amount = 0n;
    try { amount = abiCoder.decode(["uint256","uint256"], log.data)[0] as bigint; } catch { /* ignore */ }
    const gas = await getGasInfo(provider, log.transactionHash);
    const fee = gas.from === walletLow ? gas.gasUsed * gas.gasPrice : 0n;
    rows.push({ ts, row: {
      date: toKoinlyDate(ts),
      receivedAmount: amount > 0n ? fmtToken(amount) : "", receivedCurrency: amount > 0n ? "GNET" : "",
      feeAmount: fee > 0n ? fmtToken(fee) : "", feeCurrency: fee > 0n ? "GNET" : "",
      label: "stake",
      description: "GNET withdrawn from veGNET",
      txHash: log.transactionHash,
    }});
  }

  // ── 6. Legacy staking: CreateStake / RemoveStake / RewardPaid / ExtraRewardProvided ──
  onProgress("Fetching legacy staking events…");
  const [createStakeLogs, removeStakeLogs, rewardPaidLogs, extraRewardLogs] = await Promise.all([
    getLogsChunked(provider, { address: STAKING_CONTRACT, topics: [SIG_CREATE_STAKE, walletTopic] }, fromBlock, toBlock, onProgress),
    getLogsChunked(provider, { address: STAKING_CONTRACT, topics: [SIG_REMOVE_STAKE, walletTopic] }, fromBlock, toBlock, onProgress),
    getLogsChunked(provider, { address: STAKING_CONTRACT, topics: [SIG_REWARD_PAID, walletTopic] }, fromBlock, toBlock, onProgress),
    getLogsChunked(provider, { address: STAKING_CONTRACT, topics: [SIG_EXTRA_REWARD, walletTopic] }, fromBlock, toBlock, onProgress),
  ]);
  checkAbort();

  for (const log of createStakeLogs) {
    const ts     = await blockTs(provider, log.blockNumber);
    const amount = abiCoder.decode(["uint256"], log.data)[0] as bigint;
    const gas    = await getGasInfo(provider, log.transactionHash);
    const fee    = gas.from === walletLow ? gas.gasUsed * gas.gasPrice : 0n;
    rows.push({ ts, row: {
      date: toKoinlyDate(ts),
      sentAmount: fmtToken(amount), sentCurrency: "GNET",
      feeAmount: fee > 0n ? fmtToken(fee) : "", feeCurrency: fee > 0n ? "GNET" : "",
      label: "stake",
      description: "GNET staked (legacy staking)",
      txHash: log.transactionHash,
    }});
  }

  for (const log of removeStakeLogs) {
    const ts     = await blockTs(provider, log.blockNumber);
    const amount = abiCoder.decode(["uint256"], log.data)[0] as bigint;
    const gas    = await getGasInfo(provider, log.transactionHash);
    const fee    = gas.from === walletLow ? gas.gasUsed * gas.gasPrice : 0n;
    rows.push({ ts, row: {
      date: toKoinlyDate(ts),
      receivedAmount: fmtToken(amount), receivedCurrency: "GNET",
      feeAmount: fee > 0n ? fmtToken(fee) : "", feeCurrency: fee > 0n ? "GNET" : "",
      label: "stake",
      description: "GNET unstaked (legacy staking)",
      txHash: log.transactionHash,
    }});
  }

  for (const log of rewardPaidLogs) {
    const ts     = await blockTs(provider, log.blockNumber);
    const amount = abiCoder.decode(["uint256"], log.data)[0] as bigint;
    rows.push({ ts, row: {
      date: toKoinlyDate(ts),
      receivedAmount: fmtToken(amount), receivedCurrency: "GNET",
      label: "reward",
      description: "GNET staking reward (legacy staking)",
      txHash: log.transactionHash,
    }});
  }

  for (const log of extraRewardLogs) {
    const ts     = await blockTs(provider, log.blockNumber);
    const amount = abiCoder.decode(["uint256"], log.data)[0] as bigint;
    rows.push({ ts, row: {
      date: toKoinlyDate(ts),
      receivedAmount: fmtToken(amount), receivedCurrency: "GNET",
      label: "reward",
      description: "GNET extra staking reward (legacy staking)",
      txHash: log.transactionHash,
    }});
  }
  checkAbort();

  // ── 7. RewardDistributor: ClaimReward (merkle-based GNET vesting) ─────────────
  onProgress("Fetching RewardDistributor claim events…");
  // Query by account (topic[3]) — the address that earned the reward
  const claimLogs = await getLogsChunked(
    provider,
    { address: REWARD_DIST_CONTRACT, topics: [SIG_CLAIM_REWARD, null, null, walletTopic] },
    fromBlock, toBlock, onProgress,
  );
  checkAbort();

  for (const log of claimLogs) {
    const ts     = await blockTs(provider, log.blockNumber);
    const decoded = abiCoder.decode(["uint256", "uint256"], log.data);
    const amount = decoded[1] as bigint;
    const sendTo = ("0x" + log.topics[2].slice(26)).toLowerCase();
    const desc   = sendTo !== walletLow
      ? `GNET vesting claim (sent to ${sendTo})`
      : "GNET vesting claim";
    rows.push({ ts, row: {
      date: toKoinlyDate(ts),
      receivedAmount: fmtToken(amount), receivedCurrency: "GNET",
      label: "reward",
      description: desc,
      txHash: log.transactionHash,
    }});
  }

  rows.sort((a, b) => a.ts - b.ts);
  return rows;
}

// ── component ─────────────────────────────────────────────────────────────────

interface TaxExportProps {
  walletAddr: string;
  lang: Lang;
  onBack: () => void;
}

export default function TaxExport({ walletAddr, lang, onBack }: TaxExportProps) {
  const T = translations[lang];
  const [year, setYear] = useState("2025");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, msg]);
    setTimeout(() => logsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleGenerate = async () => {
    setError("");
    setCsvContent(null);
    setLogs([]);
    setRunning(true);

    const fromTs = Math.floor(new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000);
    const toTs   = Math.floor(new Date(`${year}-12-31T23:59:59Z`).getTime() / 1000);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const onProgress = (msg: string) => {
        addLog(msg);
      };
      const rows = await runExport(walletAddr, fromTs, toTs, onProgress, ctrl.signal);
      const csv = [CSV_HEADER, ...rows.map(r => makeRow(r.row))].join("\n") + "\n";
      setCsvContent(csv);
      setRowCount(rows.length);
      addLog(`✓ Done — ${rows.length} transaction(s) found`);
    } catch (e: unknown) {
      if ((e as Error).message === "Cancelled") {
        addLog("— Cancelled");
      } else {
        setError(String(e));
        addLog(`✗ Error: ${String(e)}`);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const handleDownload = () => {
    if (!csvContent) return;
    const slug = walletAddr.slice(0, 10).toLowerCase();
    downloadCsv(csvContent, `koinly-${slug}-${year}.csv`);
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button style={btnDim} onClick={onBack}>← Back</button>
        <span style={{ color: C.accent, fontWeight: "bold", fontSize: 14 }}>{T.taxTitle}</span>
      </div>

      <div style={card}>
        <div style={{ color: C.muted, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>{T.taxSectionSettings}</div>

        {walletAddr ? (
          <div style={{ marginBottom: 10, color: C.textDim, fontSize: 12 }}>
            {T.taxWalletLabel}: <span style={{ color: C.text, fontFamily: "monospace" }}>{walletAddr}</span>
          </div>
        ) : (
          <div style={{ marginBottom: 10, color: C.orange, fontSize: 12 }}>
            {T.taxWalletNotConnected}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: C.textDim, fontSize: 12, width: 70 }}>{T.taxYearLabel}</span>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={year}
              onChange={e => setYear(e.target.value)}
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}>
          {!running ? (
            <button style={btnStyle} onClick={handleGenerate} disabled={!walletAddr}>
              {T.taxBtnGenerate}
            </button>
          ) : (
            <button style={{ ...btnDim, borderColor: C.red, color: C.red }} onClick={handleCancel}>
              {T.taxBtnCancel}
            </button>
          )}
          {!running && !csvContent && walletAddr && (
            <span style={{ color: C.muted, fontSize: 11 }}>{T.taxTimingHint}</span>
          )}
          {csvContent && !running && (
            <button style={{ ...btnStyle, borderColor: C.green, color: C.green }} onClick={handleDownload}>
              {T.taxBtnDownload(rowCount)}
            </button>
          )}
        </div>

        {error && <div style={{ marginTop: 8, color: C.red, fontSize: 12 }}>{error}</div>}
      </div>

      {/* Progress log */}
      {logs.length > 0 && (
        <div style={{ ...card, padding: "8px 12px" }}>
          <div style={{ color: C.muted, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>{T.taxSectionProgress}</div>
          <div style={{ maxHeight: 200, overflowY: "auto", fontSize: 11, color: C.textDim, lineHeight: 1.7 }}>
            {logs.map((l, i) => (
              <div key={i} style={{ color: l.startsWith("✓") ? C.green : l.startsWith("✗") ? C.red : l.startsWith("⚠") ? C.orange : C.textDim }}>
                {l}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
          {running && (
            <div style={{ marginTop: 6, height: 2, background: C.border, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", background: C.accent, borderRadius: 2, width: "100%", animation: "pulse-bar 1.4s ease-in-out infinite", transformOrigin: "left" }} />
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ ...card, color: C.textDim, fontSize: 11, lineHeight: 2 }}>
        <div style={{ color: C.muted, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>{T.taxSectionLegend}</div>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            {([
              [T.taxLegendNativeGnet, "—", T.taxLegendNativeGnetNote],
              [T.taxLegendGubiIn, "reward", T.taxLegendGubiInNote],
              [T.taxLegendGubiOut, "—", T.taxLegendGubiOutNote],
              [T.taxLegendWgnet, "—", T.taxLegendWgnetNote],
              [T.taxLegendVeLock, "stake", T.taxLegendVeLockNote],
              [T.taxLegendVeUnlock, "stake", T.taxLegendVeUnlockNote],
              [T.taxLegendStakeStake, "stake", T.taxLegendStakeStakeNote],
              [T.taxLegendStakeReward, "reward", T.taxLegendStakeRewardNote],
              [T.taxLegendVesting, "reward", T.taxLegendVestingNote],
              [T.taxLegendFees, "—", T.taxLegendFeesNote],
            ] as [string, string, string][]).map(([event, label, note]) => (
              <tr key={event}>
                <td style={{ paddingRight: 12, color: C.text }}>{event}</td>
                <td style={{ paddingRight: 12, color: label === "—" ? C.muted : C.accent, fontFamily: "monospace" }}>{label}</td>
                <td style={{ color: C.muted }}>{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
