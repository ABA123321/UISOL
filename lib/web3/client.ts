import { BrowserProvider, Contract, JsonRpcProvider } from "ethers"

import { ABI, ERC20_ABI } from "./abi"
import { ADDRESSES, CHAIN_ID, RPC_URL, getWeb3ConfigIssues, isWeb3Configured, type Address } from "./addresses"

type Eip1193Provider = {
  request: (args: { method: string; params?: any[] | Record<string, any> }) => Promise<any>
  on?: (event: string, cb: (...args: any[]) => void) => void
  removeListener?: (event: string, cb: (...args: any[]) => void) => void
}

export function getInjectedProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = (window as any).ethereum as Eip1193Provider | undefined
  return p ?? null
}

export function getReadProvider() {
  if (!RPC_URL) throw new Error("Missing RPC URL (NEXT_PUBLIC_RPC_URL)")
  return new JsonRpcProvider(RPC_URL, CHAIN_ID || undefined)
}

export function getBrowserProvider() {
  const injected = getInjectedProvider()
  if (!injected) throw new Error("No injected wallet found")
  return new BrowserProvider(injected as any)
}

export async function getSignerAddress(): Promise<Address> {
  const bp = getBrowserProvider()
  const signer = await bp.getSigner()
  return (await signer.getAddress()) as Address
}

export async function switchChain(chainId: number) {
  const injected = getInjectedProvider()
  if (!injected) throw new Error("No injected wallet found")
  const hex = "0x" + chainId.toString(16)
  await injected.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] })
}

export async function connectWallet(chainId: number): Promise<Address> {
  if (!isWeb3Configured()) {
    const issues = getWeb3ConfigIssues()
    throw new Error(issues.length ? issues.join("\n") : "Web3 env not configured")
  }
  const injected = getInjectedProvider()
  if (!injected) throw new Error("No injected wallet found")
  await injected.request({ method: "eth_requestAccounts" })
  await switchChain(chainId)
  return await getSignerAddress()
}

export function getReadContracts() {
  const p = getReadProvider()
  return {
    usdt: new Contract(ADDRESSES.usdt, ERC20_ABI, p),
    advent: new Contract(ADDRESSES.advent, ABI.advent, p),
    referralRegistry: new Contract(ADDRESSES.referralRegistry, ABI.referralRegistry, p),
    stamina: new Contract(ADDRESSES.stamina, ABI.stamina, p),
    marketplace: new Contract(ADDRESSES.marketplace, ABI.marketplace, p),
    game: new Contract(ADDRESSES.game, ABI.game, p),
    materials: new Contract(ADDRESSES.materials, ABI.materials, p),
    characterNft: new Contract(ADDRESSES.characterNft, ABI.characterNft, p),
  } as const
}

export async function getWriteContracts() {
  const bp = getBrowserProvider()
  const signer = await bp.getSigner()
  return {
    usdt: new Contract(ADDRESSES.usdt, ERC20_ABI, signer),
    advent: new Contract(ADDRESSES.advent, ABI.advent, signer),
    referralRegistry: new Contract(ADDRESSES.referralRegistry, ABI.referralRegistry, signer),
    stamina: new Contract(ADDRESSES.stamina, ABI.stamina, signer),
    marketplace: new Contract(ADDRESSES.marketplace, ABI.marketplace, signer),
    game: new Contract(ADDRESSES.game, ABI.game, signer),
    materials: new Contract(ADDRESSES.materials, ABI.materials, signer),
    characterNft: new Contract(ADDRESSES.characterNft, ABI.characterNft, signer),
  } as const
}

