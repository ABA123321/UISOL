import referralArtifact from "../../../artifacts/contracts/ReferralRegistry.sol/ReferralRegistry.json"
import staminaArtifact from "../../../artifacts/contracts/Stamina.sol/Stamina.json"
import marketplaceArtifact from "../../../artifacts/contracts/Marketplace.sol/Marketplace.json"

import gameArtifact from "../../../artifacts/contracts/Game.sol/Game.json"
import materialsArtifact from "../../../artifacts/contracts/Materials.sol/Materials.json"
import characterArtifact from "../../../artifacts/contracts/CharacterNFT.sol/CharacterNFT.json"
import adventArtifact from "../../../artifacts/contracts/AdventToken.sol/AdventToken.json"

export const ABI = {
  referralRegistry: (referralArtifact as any).abi as any[],
  stamina: (staminaArtifact as any).abi as any[],
  marketplace: (marketplaceArtifact as any).abi as any[],
  game: (gameArtifact as any).abi as any[],
  materials: (materialsArtifact as any).abi as any[],
  characterNft: (characterArtifact as any).abi as any[],
  advent: (adventArtifact as any).abi as any[],
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

