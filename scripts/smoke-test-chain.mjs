// Smoke test: 验证主网合约地址 + ABI 在 BSC 上能正常读取
// 运行: node scripts/smoke-test-chain.mjs
import { JsonRpcProvider, Contract } from "ethers"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")

function loadAbi(name) {
  return JSON.parse(readFileSync(resolve(root, `lib/web3/abi-json/${name}.json`), "utf8"))
}

const RPC = process.env.NEXT_PUBLIC_RPC_URL || "https://bsc-dataseed.binance.org"
const provider = new JsonRpcProvider(RPC, 56, { staticNetwork: true })

const addrs = {
  referralRegistry: "0xdEBE3c804f66d8B2Ab24e06beD3E186Fd9808d77",
  stamina: "0x6CED5955EA4F61C489027EA511DB3FFEFE697F03",
  advent: "0x5106E2921eBeeDe892eB4E3dAb660685b9bB3Fcb",
  materials: "0x69028EeBbE70B964cC977551D0a0E6BDbf01Ac49",
  characterNft: "0x31148e25A97C1E83E82a0c0029d4A2d7cD8b1c22",
  game: "0xe1708805b3321d04167b5fCb96D2BaB336824130",
  marketplace: "0x06975003578Da8Cc312903627e881bd5B0ad09fe",
}

async function main() {
  console.log(`[smoke] RPC=${RPC}`)
  const net = await provider.getNetwork()
  console.log(`[smoke] chainId=${net.chainId} (expected 56)`)
  const block = await provider.getBlockNumber()
  console.log(`[smoke] head block=${block}`)

  // 1. 每个合约地址都能拿到 bytecode（即真的部署过）
  for (const [k, v] of Object.entries(addrs)) {
    const code = await provider.getCode(v)
    console.log(`[smoke] ${k.padEnd(18)} ${v} bytecode=${code.length > 2 ? "OK(" + code.length + ")" : "MISSING"}`)
  }

  // 2. 用真实 ABI 调几个 view 函数，确认 ABI 和合约匹配
  const checks = []

  // characterNft: name() / symbol() / totalSupply()
  const nft = new Contract(addrs.characterNft, loadAbi("characterNft"), provider)
  try {
    const [name, symbol] = await Promise.all([nft.name(), nft.symbol()])
    checks.push(`characterNft.name()=${name} symbol()=${symbol}`)
    try {
      const total = await nft.totalSupply()
      checks.push(`characterNft.totalSupply()=${total}`)
    } catch {}
  } catch (e) {
    checks.push(`characterNft FAIL: ${e.shortMessage || e.message}`)
  }

  // materials (ERC1155): uri(0)
  const mat = new Contract(addrs.materials, loadAbi("materials"), provider)
  try {
    const uri = await mat.uri(1)
    checks.push(`materials.uri(1)=${uri.slice(0, 80)}`)
  } catch (e) {
    checks.push(`materials.uri(1) FAIL: ${e.shortMessage || e.message}`)
  }

  // game: 找一个 view 函数读
  const gameAbi = loadAbi("game")
  const gameViews = gameAbi.filter((x) => x.type === "function" && (x.stateMutability === "view" || x.stateMutability === "pure") && x.inputs.length === 0)
  console.log(`[smoke] game zero-arg view fns:`, gameViews.map((v) => v.name).slice(0, 10))
  const game = new Contract(addrs.game, gameAbi, provider)
  for (const fn of gameViews.slice(0, 5)) {
    try {
      const r = await game[fn.name]()
      checks.push(`game.${fn.name}()=${String(r).slice(0, 80)}`)
    } catch (e) {
      checks.push(`game.${fn.name}() FAIL: ${(e.shortMessage || e.message).slice(0, 80)}`)
    }
  }

  // marketplace: 找一个 view 函数
  const mktAbi = loadAbi("marketplace")
  const mktViews = mktAbi.filter((x) => x.type === "function" && (x.stateMutability === "view" || x.stateMutability === "pure") && x.inputs.length === 0)
  console.log(`[smoke] marketplace zero-arg view fns:`, mktViews.map((v) => v.name).slice(0, 10))
  const mkt = new Contract(addrs.marketplace, mktAbi, provider)
  for (const fn of mktViews.slice(0, 5)) {
    try {
      const r = await mkt[fn.name]()
      checks.push(`marketplace.${fn.name}()=${String(r).slice(0, 80)}`)
    } catch (e) {
      checks.push(`marketplace.${fn.name}() FAIL: ${(e.shortMessage || e.message).slice(0, 80)}`)
    }
  }

  // stamina / advent / referral 各挑一个 view
  for (const [k, abiName] of [
    ["stamina", "stamina"],
    ["advent", "advent"],
    ["referralRegistry", "referralRegistry"],
  ]) {
    const abi = loadAbi(abiName)
    const views = abi.filter((x) => x.type === "function" && (x.stateMutability === "view" || x.stateMutability === "pure") && x.inputs.length === 0)
    const c = new Contract(addrs[k], abi, provider)
    for (const fn of views.slice(0, 3)) {
      try {
        const r = await c[fn.name]()
        checks.push(`${k}.${fn.name}()=${String(r).slice(0, 80)}`)
      } catch (e) {
        checks.push(`${k}.${fn.name}() FAIL: ${(e.shortMessage || e.message).slice(0, 80)}`)
      }
    }
  }

  console.log("\n=== Read results ===")
  for (const c of checks) console.log("  " + c)
}

main().catch((e) => {
  console.error("FATAL:", e)
  process.exit(1)
})
