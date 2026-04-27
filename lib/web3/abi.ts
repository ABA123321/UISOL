/**
 * 合约 ABI 占位（演示版）
 *
 * 原本这里通过 `../../../artifacts/contracts/*.sol/*.json` 引入 Hardhat 编译产物，
 * 但本仓库（前端 Demo）并不包含合约项目，因此运行时编译会因找不到 JSON 文件而失败。
 *
 * - 演示模式下（`NEXT_PUBLIC_RPC_URL` / `NEXT_PUBLIC_*_ADDRESS` 未配置时），
 *   `lib/web3/addresses.ts` 中 `isWeb3Configured()` 返回 false，
 *   `getReadContracts / getWriteContracts` 不会被实际触发，因此空 ABI 不影响 UI 浏览。
 * - 若需启用真实链上交互，请把对应合约的 ABI 数组填入下方各字段。
 */
export const ABI = {
  referralRegistry: [] as any[],
  stamina: [] as any[],
  marketplace: [] as any[],
  game: [] as any[],
  materials: [] as any[],
  characterNft: [] as any[],
  advent: [] as any[],
} as const

// Minimal ERC20 ABI for USDT
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
] as const
