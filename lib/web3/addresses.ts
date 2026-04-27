import { getAddress } from "ethers"

export type Address = `0x${string}`

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address

// Keep aligned with `UISOL/.env.example` (BSC mainnet defaults).
const DEFAULT_CHAIN_ID = 56

function optEnv(name: string): string | undefined {
  const v = process.env[name]
  return v && v.trim() ? v.trim() : undefined
}

function asAddress(name: string): Address {
  const v = optEnv(name)
  if (!v) return ZERO_ADDRESS
  try {
    return getAddress(v) as Address
  } catch {
    return ZERO_ADDRESS
  }
}

export const CHAIN_ID = Number(optEnv("NEXT_PUBLIC_CHAIN_ID") ?? String(DEFAULT_CHAIN_ID)) || DEFAULT_CHAIN_ID
export const RPC_URL = optEnv("NEXT_PUBLIC_RPC_URL") ?? ""

export const ADDRESSES = {
  usdt: asAddress("NEXT_PUBLIC_USDT_ADDRESS"),
  advent: asAddress("NEXT_PUBLIC_ADVENT_ADDRESS"),
  materials: asAddress("NEXT_PUBLIC_MATERIALS_ADDRESS"),
  characterNft: asAddress("NEXT_PUBLIC_CHARACTER_NFT_ADDRESS"),
  referralRegistry: asAddress("NEXT_PUBLIC_REFERRAL_REGISTRY_ADDRESS"),
  stamina: asAddress("NEXT_PUBLIC_STAMINA_ADDRESS"),
  marketplace: asAddress("NEXT_PUBLIC_MARKETPLACE_ADDRESS"),
  game: asAddress("NEXT_PUBLIC_GAME_ADDRESS"),
} as const

export function getWeb3ConfigIssues(): string[] {
  const issues: string[] = []
  if (!RPC_URL.trim()) issues.push("缺少 NEXT_PUBLIC_RPC_URL（用于链上只读查询；请复制 `.env.example` 填到 `.env.local`）")

  // allow USDT-only reads, but for gameplay we expect these too
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
    issues.push("仍有合约地址为 0x000…0000（请把 `.env.local` 里的 NEXT_PUBLIC_*_ADDRESS 全部替换为部署地址，并重启 dev server）")
  }

  return issues
}

export function isWeb3Configured(): boolean {
  return getWeb3ConfigIssues().length === 0
}

export { ZERO_ADDRESS }

