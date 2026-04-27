import { getAddress } from "ethers"

export type Address = `0x${string}`

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address

// === BSC Mainnet 默认部署 ===
// 这些地址作为兜底，使前端在没有 `.env.local` 的情况下也能直接读取主网链上数据。
// 如需切到测试网/其它部署，可通过 `NEXT_PUBLIC_*_ADDRESS` 覆盖。
const DEFAULT_CHAIN_ID = 56
const DEFAULT_RPC_URL = "https://bsc-dataseed.binance.org"

const DEFAULT_ADDRESSES = {
  // BSC Mainnet USDT (BEP20)
  usdt: "0x55d398326f99059fF775485246999027B3197955",
  // 项目主网部署（区块高度详见 README / 部署清单）
  referralRegistry: "0xdEBE3c804f66d8B2Ab24e06beD3E186Fd9808d77", // block 95047672
  stamina:          "0x6CED5955EA4F61C489027EA511DB3FFEFE697F03", // block 95048262
  advent:           "0x5106E2921eBeeDe892eB4E3dAb660685b9bB3Fcb", // block 95048481
  materials:        "0x69028EeBbE70B964cC977551D0a0E6BDbf01Ac49", // block 95048712
  characterNft:     "0x31148e25A97C1E83E82a0c0029d4A2d7cD8b1c22", // block 95048796
  game:             "0xe1708805b3321d04167b5fCb96D2BaB336824130", // block 95049232
  marketplace:      "0x06975003578Da8Cc312903627e881bd5B0ad09fe", // block 95049516
} as const

function optEnv(name: string): string | undefined {
  const v = process.env[name]
  return v && v.trim() ? v.trim() : undefined
}

function asAddress(name: string, fallback: string): Address {
  const v = optEnv(name) ?? fallback
  try {
    return getAddress(v) as Address
  } catch {
    return ZERO_ADDRESS
  }
}

export const CHAIN_ID =
  Number(optEnv("NEXT_PUBLIC_CHAIN_ID") ?? String(DEFAULT_CHAIN_ID)) || DEFAULT_CHAIN_ID
export const RPC_URL = optEnv("NEXT_PUBLIC_RPC_URL") ?? DEFAULT_RPC_URL

export const ADDRESSES = {
  usdt:             asAddress("NEXT_PUBLIC_USDT_ADDRESS",              DEFAULT_ADDRESSES.usdt),
  advent:           asAddress("NEXT_PUBLIC_ADVENT_ADDRESS",            DEFAULT_ADDRESSES.advent),
  materials:        asAddress("NEXT_PUBLIC_MATERIALS_ADDRESS",         DEFAULT_ADDRESSES.materials),
  characterNft:     asAddress("NEXT_PUBLIC_CHARACTER_NFT_ADDRESS",     DEFAULT_ADDRESSES.characterNft),
  referralRegistry: asAddress("NEXT_PUBLIC_REFERRAL_REGISTRY_ADDRESS", DEFAULT_ADDRESSES.referralRegistry),
  stamina:          asAddress("NEXT_PUBLIC_STAMINA_ADDRESS",           DEFAULT_ADDRESSES.stamina),
  marketplace:      asAddress("NEXT_PUBLIC_MARKETPLACE_ADDRESS",       DEFAULT_ADDRESSES.marketplace),
  game:             asAddress("NEXT_PUBLIC_GAME_ADDRESS",              DEFAULT_ADDRESSES.game),
} as const

export function getWeb3ConfigIssues(): string[] {
  const issues: string[] = []
  if (!RPC_URL.trim()) {
    issues.push("缺少 NEXT_PUBLIC_RPC_URL（链上只读查询所需）")
  }
  const required = [
    ADDRESSES.usdt,
    ADDRESSES.advent,
    ADDRESSES.referralRegistry,
    ADDRESSES.stamina,
    ADDRESSES.marketplace,
    ADDRESSES.game,
    ADDRESSES.materials,
    ADDRESSES.characterNft,
  ]
  if (required.some((a) => a === ZERO_ADDRESS)) {
    issues.push("仍有合约地址为 0x000…0000（请检查 NEXT_PUBLIC_*_ADDRESS 覆盖是否正确）")
  }
  return issues
}

export function isWeb3Configured(): boolean {
  return getWeb3ConfigIssues().length === 0
}

export { ZERO_ADDRESS }
