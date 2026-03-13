export const CHAIN_ID = 613419;
export const RPC_URL = "https://galactica-mainnet.g.alchemy.com/public";
export const API_BASE = "https://admin-panel.galactica.com/api";

export const CONTRACTS = {
  veGNET: "0xdFbE5AC59027C6f38ac3E2eDF6292672A8eCffe4",
  gubiToken: "0xFEa4F549eFB1F8B2cBA8d029e6845Ee431e142AA",
  gubiPool: "0x50AF2AAb1455C1C06B3b8e623549dDE437F54EeF",
  wgnet: "0x690F1eEf8AcEaD09Ac695d9111Af081045c6d5b7",
  archai: "0x22b48a764d2aAAe14d751aD2B5fcdf6C0A4d95D7",
} as const;

export const MONTHLY_EMISSION = 5_000_000;

// Inflow schedule: [label, GNET amount]
export const INFLOW_SCHEDULE: [string, number][] = [
  ["Initial Unlock", 876142],
  ["October 2025", 897407],
  ["November 2025", 1151748],
  ["December 2025", 1152000],
  ["January 2026", 1152000],
  ["February 2026", 5466677],
  ["March 2026", 3974677],
  ["April 2026", 3974677],
  ["May 2026", 3974677],
  ["June 2026", 3974677],
  ["July 2026", 3974677],
  ["August 2026", 3974677],
  ["September 2026", 3974677],
  ["October 2026", 3974677],
  ["November 2026", 3974677],
  ["December 2026", 3974677],
  ["January 2027", 3974677],
  ["February 2027", 3974677],
  ["March 2027", 3974677],
  ["April 2027", 3974677],
  ["May 2027", 3974677],
  ["June 2027", 3974677],
  ["July 2027", 3974677],
  ["August 2027", 3974677],
  ["September 2027", 3974677],
  ["October 2027", 3974677],
  ["November 2027", 3974677],
  ["December 2027", 3974677],
  ["January 2028", 3974677],
];

export const VOTING_ESCROW_ABI = [
  "function locked(address) view returns (uint256)",
  "function lockEnd(address) view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function MAXTIME() view returns (uint256)",
];

export const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];
