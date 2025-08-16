import { getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { client } from "./client";

export const CHAIN = base; // Base mainnet
export const STAKER_ADDRESS = "0x62ceCFCdCF3327b8F3e7EAd9503a02103Ecb4527" as const;
export const DEGEN_ADDRESS = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed" as const;

export const stakerContract = getContract({
  client,
  chain: CHAIN,
  address: STAKER_ADDRESS,
});

export const degenContract = getContract({
  client,
  chain: CHAIN,
  address: DEGEN_ADDRESS,
});
