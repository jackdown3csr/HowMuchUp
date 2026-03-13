import { ethers } from "ethers";
import { CHAIN_ID } from "./constants";

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

export function isMetaMaskInstalled(): boolean {
  return typeof window !== "undefined" && !!window.ethereum?.isMetaMask;
}

export async function connectMetaMask(): Promise<string | null> {
  if (!isMetaMaskInstalled()) return null;

  const accounts = (await window.ethereum!.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts || accounts.length === 0) return null;

  // Check chain
  const chainIdHex = (await window.ethereum!.request({ method: "eth_chainId" })) as string;
  // Number() correctly handles both "0x..." hex strings and decimal strings
  const chainId = Number(chainIdHex);
  if (chainId !== CHAIN_ID) {
    const targetHex = "0x" + CHAIN_ID.toString(16);
    try {
      await window.ethereum!.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetHex }],
      });
    } catch (switchErr: unknown) {
      // 4902 = chain not added to MetaMask yet
      const code = (switchErr as { code?: number }).code;
      if (code === 4902) {
        await window.ethereum!.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: targetHex,
            chainName: "Galactica Mainnet",
            nativeCurrency: { name: "GNET", symbol: "GNET", decimals: 18 },
            rpcUrls: ["https://galactica-mainnet.g.alchemy.com/public"],
            blockExplorerUrls: ["https://explorer.galactica.com"],
          }],
        });
      } else {
        throw switchErr;
      }
    }
  }

  return accounts[0];
}
