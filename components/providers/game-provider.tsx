"use client"

/**
 * 链上版游戏状态（路线A）：
 * - 连接钱包后读取链上：USDT/$ADVENT、体力、新手礼包、材料余额、角色NFT、队伍、市场订单
 * - 写操作走真实合约，并自动补齐授权（USDT approve / Materials setApprovalForAll / ADVENT approve）
 */

import * as React from "react"
import { toast } from "sonner"
import { formatUnits, getAddress, hexlify, isHexString, parseUnits, randomBytes } from "ethers"

import {
  CLASS_NAMES,
  DUNGEONS,
  ENERGY_PRICE_USDT,
  MARKET_FEE,
  MATERIAL_KEYS,
  MAX_TEAMS_PER_ACCOUNT,
  NEW_PLAYER_ENERGY,
  RARITIES,
  RARITY_BY_LEVEL,
  SUMMON_TIER_SIZE,
  SYNTHESIS_COSTS,
  TEAM_COOLDOWN_HOURS,
  TOTAL_CHAR_CAP,
  rollPower,
  rollRarity,
  summonCostAt,
  type MaterialKey,
  type RarityLevel,
} from "@/lib/game-data"
import { ADDRESSES, CHAIN_ID, ZERO_ADDRESS, getWeb3ConfigIssues, isWeb3Configured, type Address } from "@/lib/web3/addresses"
import { connectWallet, getBrowserProvider, getReadContracts, getReadProvider, getWriteContracts } from "@/lib/web3/client"

export interface Character {
  id: string // tokenId as string
  rarity: RarityLevel
  power: number
  classIndex: number
  bornAt: number
}

export interface Team {
  id: string
  name: string
  characterIds: [string, string, string] // tokenIds as string
  /** 冷却结束时间戳；<= now 表示空闲 */
  cooldownUntil: number
}

export interface MarketListing {
  id: string
  seller: string
  material: MaterialKey
  amount: number
  pricePerUnit: number
  createdAt: number
  isMine: boolean
}

export type Inventory = Record<MaterialKey, number>

interface SummonResult {
  ok: boolean
  newCharacters?: Character[]
  reason?: string
}

interface GameContextValue {
  // 钱包
  connected: boolean
  address: Address | undefined
  shortAddress: string | undefined
  chainId: number | undefined
  walletKind: string | undefined
  connect: () => Promise<void> | void
  disconnect: () => void

  // 余额 & 资源
  advent: number
  usdt: number
  energy: number
  inventory: Inventory

  // 角色 & 队伍
  characters: Character[]
  teams: Team[]

  // 全服计数 — 用来计算抽角色价格
  globalSummoned: number
  charCap: number
  currentSummonCost: number

  // 推荐人
  referrer: string | undefined
  myReferralCode: string // for UI only; in chain-mode we show address as code

  // 市场
  listings: MarketListing[]

  // 新手礼包
  newPlayerGiftClaimed: boolean

  // actions
  summon: (count: number) => SummonResult
  buyEnergy: (count: number) => boolean
  createTeam: (ids: [string, string, string], name?: string) => boolean
  disbandTeam: (teamId: string) => void
  challenge: (teamId: string, dungeonLevel: number) => boolean
  synthesize: (level: RarityLevel) => boolean
  listMaterial: (material: MaterialKey, amount: number, pricePerUnit: number) => boolean
  cancelListing: (id: string) => void
  buyListing: (id: string, amount: number) => boolean
  bindReferrer: (code: string) => boolean
  claimNewPlayerGift: () => boolean
}

const GameContext = React.createContext<GameContextValue | null>(null)

const initialInventory: Inventory = { AE: 0, BF: 0, MR: 0, ES: 0 }

const MATERIAL_UNIT = 10n // on-chain: 1.0 material = 10 units

const matKeyToId: Record<MaterialKey, bigint> = { AE: 1n, BF: 2n, MR: 3n, ES: 4n }
const idToMatKey: Record<string, MaterialKey> = { "1": "AE", "2": "BF", "3": "MR", "4": "ES" }

function shorten(addr: string) {
  if (!addr) return ""
  return addr.length <= 12 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function deployBlock(): number {
  const v = Number(process.env.NEXT_PUBLIC_DEPLOY_BLOCK ?? "0")
  return Number.isFinite(v) && v >= 0 ? v : 0
}

function toBigIntSafe(v: any): bigint {
  try {
    return BigInt(v)
  } catch {
    return 0n
  }
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = React.useState(false)
  const [address, setAddress] = React.useState<Address | undefined>(undefined)
  const [chainId, setChainId] = React.useState<number | undefined>(undefined)
  const [walletKind, setWalletKind] = React.useState<string | undefined>(undefined)

  const [advent, setAdvent] = React.useState(0)
  const [usdt, setUsdt] = React.useState(0)
  const [energy, setEnergy] = React.useState(0)
  const [inventory, setInventory] = React.useState<Inventory>(initialInventory)

  const [characters, setCharacters] = React.useState<Character[]>([])
  const [teams, setTeams] = React.useState<Team[]>([])

  const [globalSummoned, setGlobalSummoned] = React.useState(0)
  const [referrer, setReferrer] = React.useState<string | undefined>(undefined)
  const [myReferralCode, setMyReferralCode] = React.useState("—")

  const [listings, setListings] = React.useState<MarketListing[]>([])

  // 新手礼包：连接钱包后玩家需要主动领取
  const [newPlayerGiftClaimed, setNewPlayerGiftClaimed] = React.useState(false)

  const [usdtDecimals, setUsdtDecimals] = React.useState(18)

  const loadTeamNames = React.useCallback((addr: Address) => {
    if (typeof window === "undefined") return new Map<string, string>()
    try {
      const raw = window.localStorage.getItem(`runeas.teamNames.${addr.toLowerCase()}`)
      if (!raw) return new Map()
      const parsed = JSON.parse(raw) as Record<string, string>
      return new Map(Object.entries(parsed))
    } catch {
      return new Map()
    }
  }, [])

  const saveTeamName = React.useCallback((addr: Address, teamId: string, name: string) => {
    if (typeof window === "undefined") return
    try {
      const key = `runeas.teamNames.${addr.toLowerCase()}`
      const raw = window.localStorage.getItem(key)
      const parsed = (raw ? (JSON.parse(raw) as Record<string, string>) : {}) as Record<string, string>
      parsed[teamId] = name
      window.localStorage.setItem(key, JSON.stringify(parsed))
    } catch {
      /* noop */
    }
  }, [])

  const refreshOnChain = React.useCallback(
    async (addr: Address) => {
      const r = getReadContracts()
      const [dec, uBal, aBal, stam, claimed, directRef, drawnCountBn, teamsRaw] = await Promise.all([
        r.usdt.decimals(),
        r.usdt.balanceOf(addr),
        r.advent.balanceOf(addr),
        r.stamina.stamina(addr),
        r.stamina.claimedNewbieGift(addr),
        r.referralRegistry.referrerOf(addr),
        r.game.drawnCount(),
        r.game.teamsOf(addr),
      ])

      const d = Number(dec)
      setUsdtDecimals(d)
      setUsdt(Number(formatUnits(uBal, d)))
      setAdvent(Number(formatUnits(aBal, 18)))
      setEnergy(Number(stam))
      setNewPlayerGiftClaimed(Boolean(claimed))
      setReferrer(directRef && directRef !== ZERO_ADDRESS ? shorten(directRef) : undefined)
      setGlobalSummoned(Number(drawnCountBn))

      // Materials balances (divide by MATERIAL_UNIT for display)
      const ids = [1n, 2n, 3n, 4n]
      const bals: bigint[] = await Promise.all(ids.map((id) => r.materials.balanceOf(addr, id).then(toBigIntSafe)))
      setInventory({
        AE: Number(bals[0] / MATERIAL_UNIT),
        BF: Number(bals[1] / MATERIAL_UNIT),
        MR: Number(bals[2] / MATERIAL_UNIT),
        ES: Number(bals[3] / MATERIAL_UNIT),
      })

      // Teams
      const teamNames = loadTeamNames(addr)
      const t: Team[] = (teamsRaw as any[]).map((tr: any, idx: number) => {
        const idsArr = (tr.characterIds as any[]).map((x) => String(x)) as [string, string, string]
        const last = Number(tr.lastChallengeAt ?? 0)
        const cooldownUntil = last ? (last + TEAM_COOLDOWN_HOURS * 3600) * 1000 : 0
        const teamId = String(idx)
        return {
          id: teamId,
          name: teamNames.get(teamId) ?? `深渊小队 #${idx + 1}`,
          characterIds: idsArr,
          cooldownUntil,
        }
      })
      setTeams(t)

      // Characters: scan Transfer events from deploy block and keep those currently owned.
      try {
        const p = getReadProvider()
        const latest = await p.getBlockNumber()
        const fromBlock = deployBlock()
        const topic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" // Transfer(address,address,uint256)
        const toTopic = "0x" + addr.toLowerCase().replace(/^0x/, "").padStart(64, "0")
        const chunk = 5000
        const tokenIds = new Set<string>()
        for (let start = fromBlock; start <= latest; start += chunk + 1) {
          const end = Math.min(latest, start + chunk)
          const logs = await p.getLogs({
            address: ADDRESSES.characterNft,
            fromBlock: start,
            toBlock: end,
            topics: [topic, null, toTopic],
          })
          for (const lg of logs) {
            const tokenId = toBigIntSafe(lg.topics?.[3])
            if (tokenId > 0n) tokenIds.add(tokenId.toString())
          }
        }
        const owned: Character[] = []
        for (const tid of tokenIds) {
          const owner = await r.characterNft.ownerOf(tid)
          if (String(owner).toLowerCase() !== addr.toLowerCase()) continue
          const ch = await r.characterNft.characters(tid)
          const level = Number(ch[0]) as RarityLevel
          const power = Number(ch[1])
          owned.push({
            id: tid,
            rarity: level,
            power,
            classIndex: Number(BigInt(tid) % BigInt(CLASS_NAMES.length)),
            bornAt: Date.now(),
          })
        }
        owned.sort((a, b) => Number(BigInt(b.id) - BigInt(a.id)))
        setCharacters(owned)
      } catch {
        // If log scan is too slow, keep empty; gameplay will still work.
        setCharacters([])
      }

      // Marketplace orders: iterate first N orders
      try {
        const next = Number(await r.marketplace.nextOrderId())
        const max = Math.min(next - 1, 200)
        const orders = await Promise.all(
          Array.from({ length: max }, (_, i) => r.marketplace.orders(i + 1)),
        )
        const parsed: MarketListing[] = []
        for (let i = 0; i < orders.length; i++) {
          const o: any = orders[i]
          if (!o.active) continue
          const materialId = String(o.materialId)
          const key = idToMatKey[materialId]
          if (!key) continue
          const remainingOnchain = toBigIntSafe(o.remaining)
          const amountUi = Number(remainingOnchain / MATERIAL_UNIT)
          if (amountUi <= 0) continue
          const pricePerUnitOnchain = toBigIntSafe(o.pricePerUnit)
          // UI price is per 1.0 material, but contract is per 0.1 unit.
          const priceUi = Number(formatUnits(pricePerUnitOnchain * MATERIAL_UNIT, usdtDecimals))
          parsed.push({
            id: String(i + 1),
            seller: shorten(String(o.seller)),
            material: key,
            amount: amountUi,
            pricePerUnit: priceUi,
            createdAt: Date.now(),
            isMine: String(o.seller).toLowerCase() === addr.toLowerCase(),
          })
        }
        setListings(parsed)
      } catch {
        setListings([])
      }
    },
    [loadTeamNames, usdtDecimals],
  )

  const connect = React.useCallback(async () => {
    if (!isWeb3Configured()) {
      const issues = getWeb3ConfigIssues()
      toast.error("Web3 环境未就绪", {
        description:
          issues.join("\n") ||
          "请先复制 UISOL/.env.example → UISOL/.env.local 并填入部署地址；修改后需要重启 `npm run dev` 并硬刷新页面。",
      })
      return
    }

    try {
      const addr = await connectWallet(CHAIN_ID)
      const bp = getBrowserProvider()
      const net = await bp.getNetwork()
      setConnected(true)
      setAddress(addr)
      setChainId(Number(net.chainId))
      setWalletKind("Injected Wallet")
      setMyReferralCode(addr)
      await refreshOnChain(addr)
      toast.success("钱包已连接", {
        description: shorten(addr),
      })
    } catch (err) {
      toast.error("连接失败", { description: (err as Error)?.message ?? "请重试" })
    }
  }, [refreshOnChain])

  const disconnect = React.useCallback(() => {
    setConnected(false)
    setAddress(undefined)
    setChainId(undefined)
    setWalletKind(undefined)
    toast.info("已断开钱包")
  }, [])

  // Sync injected wallet account/chain changes
  React.useEffect(() => {
    if (!connected) return
    const injected = (window as any)?.ethereum
    if (!injected?.on) return

    const handleAccounts = (...args: unknown[]) => {
      const accounts = (args[0] as string[]) ?? []
      if (accounts.length === 0) {
        setConnected(false)
        setAddress(undefined)
        setChainId(undefined)
        toast.info("钱包已断开")
      } else {
        const a = getAddress(accounts[0]) as Address
        setAddress(a)
        setMyReferralCode(a)
        toast.info("账户已切换", { description: shorten(a) })
        refreshOnChain(a)
      }
    }

    const handleChain = (...args: unknown[]) => {
      const newChain = args[0] as string
      const id = parseInt(newChain, 16)
      setChainId(id)
      toast.info("网络已切换", { description: String(id) })
    }

    injected.on("accountsChanged", handleAccounts)
    injected.on("chainChanged", handleChain)

    return () => {
      injected.removeListener?.("accountsChanged", handleAccounts)
      injected.removeListener?.("chainChanged", handleChain)
    }
  }, [connected, refreshOnChain])

  const requireConnected = React.useCallback(() => {
    if (!connected) {
      toast.error("请先连接钱包", {
        description: "点击右上角 LOGO 按钮连接 BSC 钱包",
      })
      return false
    }
    if (!address) return false
    return true
  }, [connected, address])

  const claimNewPlayerGift = React.useCallback(() => {
    if (!requireConnected()) return false
    if (newPlayerGiftClaimed) return false
    ;(async () => {
      try {
        const w = await getWriteContracts()
        const tx = await w.stamina.claimNewbieGift()
        await tx.wait()
        await refreshOnChain(address!)
        toast.success("新手礼包已领取", { description: `+${NEW_PLAYER_ENERGY} 点体力` })
      } catch (e: any) {
        toast.error("领取失败", { description: e?.shortMessage ?? e?.message ?? "交易失败" })
      }
    })()
    return true
  }, [requireConnected, newPlayerGiftClaimed, refreshOnChain, address])

  const summon = React.useCallback(
    (count: number): SummonResult => {
      if (!requireConnected()) return { ok: false, reason: "未连接" }
      ;(async () => {
        try {
          const w = await getWriteContracts()
          const r = getReadContracts()

          // Commit/reveal salt
          const salt = hexlify(randomBytes(32))
          const seedCommit = (await r.game.callStatic.requestDrawWithCommit(count, "0x" + "00".repeat(32))).catch(
            () => null,
          )
          void seedCommit
          const commit = (await r.game.interface).encodeFunctionData("requestDrawWithCommit", [
            count,
            // seedCommit = keccak256(abi.encodePacked(user, salt))
            // compute on-chain compatible hash in solidity by using ethers solidityPackedKeccak256
          ])
          void commit
        } catch {
          /* noop */
        }
      })()

      // Actual implementation below (with solidityPackedKeccak256)
      ;(async () => {
        try {
          const { solidityPackedKeccak256 } = await import("ethers")
          const w = await getWriteContracts()
          const r = getReadContracts()

          const salt = hexlify(randomBytes(32))
          const seedCommit = solidityPackedKeccak256(["address", "bytes32"], [address!, salt])

          const tx1 = await w.game.requestDrawWithCommit(BigInt(count), seedCommit)
          await tx1.wait()

          toast.info("召唤请求已提交", { description: "等待约 2 个区块后将弹出完成召唤" })

          // Wait until finalize window (need > requestBlock + 2)
          const p = getReadProvider()
          const receipt = await p.getTransactionReceipt(tx1.hash)
          const reqBlock = receipt?.blockNumber ?? (await p.getBlockNumber())
          const target = reqBlock + 3
          while ((await p.getBlockNumber()) < target) {
            await sleep(3000)
          }

          // Ensure ADVENT allowance for burnFrom
          const price = await r.game.currentDrawPrice()
          const needed = toBigIntSafe(price) * BigInt(count) // approx upper bound (price may step, user must approve enough)
          const allow = toBigIntSafe(await r.advent.allowance(address!, ADDRESSES.game))
          if (allow < needed) {
            const txA = await w.advent.approve(ADDRESSES.game, needed)
            await txA.wait()
          }

          const tx2 = await w.game.finalizeDrawWithSalt(salt)
          await tx2.wait()
          await refreshOnChain(address!)
          toast.success("召唤完成", { description: `已铸造 ${count} 个冒险者` })
        } catch (e: any) {
          toast.error("召唤失败", { description: e?.shortMessage ?? e?.message ?? "交易失败" })
        }
      })()

      return { ok: true }
    },
    [requireConnected, address, refreshOnChain],
  )

  const buyEnergy = React.useCallback(
    (count: number): boolean => {
      if (!requireConnected()) return false
      const costUi = count * ENERGY_PRICE_USDT
      if (usdt < costUi) return false
      ;(async () => {
        try {
          const w = await getWriteContracts()
          const needed = parseUnits(costUi.toString(), usdtDecimals)
          const allowance = toBigIntSafe(await w.usdt.allowance(address!, ADDRESSES.stamina))
          if (allowance < needed) {
            const txA = await w.usdt.approve(ADDRESSES.stamina, needed)
            await txA.wait()
          }
          const tx = await w.stamina.buy(BigInt(count))
          await tx.wait()
          await refreshOnChain(address!)
          toast.success(`购买 ${count} 点体力`, { description: `${costUi.toFixed(2)} USDT` })
        } catch (e: any) {
          toast.error("购买失败", { description: e?.shortMessage ?? e?.message ?? "交易失败" })
        }
      })()
      return true
    },
    [usdt, requireConnected, usdtDecimals, address, refreshOnChain],
  )

  const createTeam = React.useCallback(
    (ids: [string, string, string], name?: string): boolean => {
      if (!requireConnected()) return false
      ;(async () => {
        try {
          const w = await getWriteContracts()
          const tokenIds = ids.map((x) => BigInt(x)) as unknown as [bigint, bigint, bigint]
          const tx = await w.game.createTeam(tokenIds)
          await tx.wait()
          await refreshOnChain(address!)
          const newTeamId = String(teams.length)
          const teamName = name?.trim() || `深渊小队 #${teams.length + 1}`
          saveTeamName(address!, newTeamId, teamName)
          toast.success("队伍组建成功", { description: teamName })
        } catch (e: any) {
          toast.error("组队失败", { description: e?.shortMessage ?? e?.message ?? "交易失败" })
        }
      })()
      return true
    },
    [teams, requireConnected, address, refreshOnChain, saveTeamName],
  )

  const disbandTeam = React.useCallback((teamId: string) => {
    void teamId
    toast.info("链上不支持解散队伍", { description: "如需解散请升级合约版本" })
  }, [])

  const challenge = React.useCallback(
    (teamId: string, dungeonLevel: number): boolean => {
      if (!requireConnected()) return false
      const idx = Number(teamId)
      ;(async () => {
        try {
          const w = await getWriteContracts()
          const tx = await w.game.challenge(BigInt(idx), BigInt(dungeonLevel))
          await tx.wait()
          await refreshOnChain(address!)
          toast.success("挑战完成", { description: `副本 ${dungeonLevel}` })
        } catch (e: any) {
          toast.error("挑战失败", { description: e?.shortMessage ?? e?.message ?? "交易失败" })
        }
      })()
      return true
    },
    [requireConnected, address, refreshOnChain],
  )

  const synthesize = React.useCallback(
    (level: RarityLevel): boolean => {
      if (!requireConnected()) return false
      ;(async () => {
        try {
          const { solidityPackedKeccak256 } = await import("ethers")
          const w = await getWriteContracts()
          const r = getReadContracts()

          const salt = hexlify(randomBytes(32))
          const seedCommit = solidityPackedKeccak256(["address", "bytes32"], [address!, salt])

          const tx1 = await w.game.requestSynthesizeWithCommit(BigInt(level), seedCommit)
          await tx1.wait()

          const p = getReadProvider()
          const receipt = await p.getTransactionReceipt(tx1.hash)
          const reqBlock = receipt?.blockNumber ?? (await p.getBlockNumber())
          const target = reqBlock + 3
          while ((await p.getBlockNumber()) < target) {
            await sleep(3000)
          }

          const cost = await r.game.synthesisCost(BigInt(level))
          const burnAdvent = toBigIntSafe(cost[4])
          const allow = toBigIntSafe(await r.advent.allowance(address!, ADDRESSES.game))
          if (allow < burnAdvent) {
            const txA = await w.advent.approve(ADDRESSES.game, burnAdvent)
            await txA.wait()
          }

          const tx2 = await w.game.finalizeSynthesizeWithSalt(salt)
          await tx2.wait()
          await refreshOnChain(address!)
          toast.success("合成完成", { description: `Lv.${level}` })
        } catch (e: any) {
          toast.error("合成失败", { description: e?.shortMessage ?? e?.message ?? "交易失败" })
        }
      })()
      return true
    },
    [requireConnected, address, refreshOnChain],
  )

  const listMaterial = React.useCallback(
    (material: MaterialKey, amount: number, pricePerUnit: number): boolean => {
      if (!requireConnected()) return false
      if (amount <= 0 || pricePerUnit <= 0) return false
      ;(async () => {
        try {
          const w = await getWriteContracts()
          const r = getReadContracts()

          // Ensure ERC1155 approval
          const approved = await r.materials.isApprovedForAll(address!, ADDRESSES.marketplace)
          if (!approved) {
            const txAp = await w.materials.setApprovalForAll(ADDRESSES.marketplace, true)
            await txAp.wait()
          }

          const onchainAmount = BigInt(amount) * MATERIAL_UNIT
          const ppu = parseUnits(pricePerUnit.toString(), usdtDecimals) / MATERIAL_UNIT
          const tx = await w.marketplace.createOrder(matKeyToId[material], onchainAmount, ppu)
          await tx.wait()
          await refreshOnChain(address!)
          toast.success("已挂单", { description: `${material} × ${amount}` })
        } catch (e: any) {
          toast.error("挂单失败", { description: e?.shortMessage ?? e?.message ?? "交易失败" })
        }
      })()
      return true
    },
    [requireConnected, address, usdtDecimals, refreshOnChain],
  )

  const cancelListing = React.useCallback((id: string) => {
    if (!requireConnected()) return
    ;(async () => {
      try {
        const w = await getWriteContracts()
        // Prefer the pause-safe cancel
        const tx = await w.marketplace.cancelOrderEvenIfPaused(BigInt(id))
        await tx.wait()
        await refreshOnChain(address!)
        toast.info("挂单已撤销")
      } catch (e: any) {
        toast.error("撤单失败", { description: e?.shortMessage ?? e?.message ?? "交易失败" })
      }
    })()
  }, [requireConnected, refreshOnChain, address])

  const buyListing = React.useCallback(
    (id: string, amount: number): boolean => {
      if (!requireConnected()) return false
      if (amount <= 0) return false
      const target = listings.find((l) => l.id === id)
      if (!target) return false
      const totalUi = amount * target.pricePerUnit
      const feeUi = totalUi * MARKET_FEE
      const costUi = totalUi + feeUi
      if (usdt < costUi) return false
      ;(async () => {
        try {
          const w = await getWriteContracts()
          const needed = parseUnits(costUi.toString(), usdtDecimals)
          const allowance = toBigIntSafe(await w.usdt.allowance(address!, ADDRESSES.marketplace))
          if (allowance < needed) {
            const txA = await w.usdt.approve(ADDRESSES.marketplace, needed)
            await txA.wait()
          }
          const onchainAmount = BigInt(amount) * MATERIAL_UNIT
          const tx = await w.marketplace.buy(BigInt(id), onchainAmount)
          await tx.wait()
          await refreshOnChain(address!)
          toast.success("购买成功", { description: `${target.material} × ${amount}` })
        } catch (e: any) {
          toast.error("购买失败", { description: e?.shortMessage ?? e?.message ?? "交易失败" })
        }
      })()
      return true
    },
    [listings, usdt, requireConnected, usdtDecimals, address, refreshOnChain],
  )

  const bindReferrer = React.useCallback(
    (code: string): boolean => {
      if (!requireConnected()) return false
      if (referrer) {
        toast.error("已绑定推荐人，无法修改")
        return false
      }
      const trimmed = code.trim()
      if (!trimmed) return false
      let ref: Address
      try {
        ref = getAddress(trimmed) as Address
      } catch {
        toast.error("推荐人格式错误", { description: "请填写推荐人钱包地址" })
        return false
      }
      if (ref.toLowerCase() === address!.toLowerCase()) return false
      ;(async () => {
        try {
          const w = await getWriteContracts()
          const tx = await w.referralRegistry.bindReferrer(ref)
          await tx.wait()
          await refreshOnChain(address!)
          toast.success("推荐人绑定成功", { description: shorten(ref) })
        } catch (e: any) {
          toast.error("绑定失败", { description: e?.shortMessage ?? e?.message ?? "交易失败" })
        }
      })()
      return true
    },
    [referrer, requireConnected, address, refreshOnChain],
  )

  const value: GameContextValue = {
    connected,
    address,
    shortAddress: address ? shorten(address) : undefined,
    chainId,
    walletKind,
    connect,
    disconnect,
    advent,
    usdt,
    energy,
    inventory,
    characters,
    teams,
    globalSummoned,
    charCap: TOTAL_CHAR_CAP,
    currentSummonCost: summonCostAt(globalSummoned),
    referrer,
    myReferralCode,
    listings,
    summon,
    buyEnergy,
    createTeam,
    disbandTeam,
    challenge,
    synthesize,
    listMaterial,
    cancelListing,
    buyListing,
    bindReferrer,
    newPlayerGiftClaimed,
    claimNewPlayerGift,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = React.useContext(GameContext)
  if (!ctx) throw new Error("useGame must be used within GameProvider")
  return ctx
}

export {
  RARITIES,
  RARITY_BY_LEVEL,
  MATERIAL_KEYS,
  DUNGEONS,
  SYNTHESIS_COSTS,
  SUMMON_TIER_SIZE,
}
