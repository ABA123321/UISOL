/**
 * 主网合约 ABI
 *
 * 来源：BSC mainnet 已验证合约的 metadata（Sourcify full match），
 * 同步至 `lib/web3/abi-json/*.json`，由 Next.js（`resolveJsonModule: true`）
 * 直接 import。如需更新合约，请把对应 ABI JSON 替换到 `abi-json/`。
 */
import referralRegistryAbi from "./abi-json/referralRegistry.json"
import staminaAbi from "./abi-json/stamina.json"
import marketplaceAbi from "./abi-json/marketplace.json"
import gameAbi from "./abi-json/game.json"
import materialsAbi from "./abi-json/materials.json"
import characterNftAbi from "./abi-json/characterNft.json"
import adventAbi from "./abi-json/advent.json"

export const ABI = {
  referralRegistry: referralRegistryAbi as any[],
  stamina: staminaAbi as any[],
  marketplace: marketplaceAbi as any[],
  game: gameAbi as any[],
  materials: materialsAbi as any[],
  characterNft: characterNftAbi as any[],
  advent: adventAbi as any[],
} as const

// USDT (BEP20) 最小化 ABI
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
] as const
