import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  FlaskConical,
  Map,
  ScrollText,
  Sparkles,
  Store,
  Users,
  Zap,
} from "lucide-react"

import { RuneAbyssLogo } from "@/components/brand/rune-abyss-logo"
import { RuneSigil } from "@/components/brand/rune-sigil"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DUNGEONS,
  RARITIES,
  SUMMON_BASE_COST,
  TOTAL_CHAR_CAP,
  ENERGY_PRICE_USDT,
  REFERRAL_DIRECT,
  REFERRAL_INDIRECT,
  MARKET_FEE,
} from "@/lib/game-data"

const FEATURES = [
  {
    icon: Sparkles,
    title: "符文召唤",
    desc: `初始 ${SUMMON_BASE_COST.toLocaleString()} $ADVENT 抽角色，每 1000 个 +10%，全服上限 ${TOTAL_CHAR_CAP.toLocaleString()}。`,
    href: "/game/summon",
  },
  {
    icon: Users,
    title: "队伍编成",
    desc: "3 角色组队，单账号最多 8 队，每队独立 24h 冷却。",
    href: "/game/teams",
  },
  {
    icon: Map,
    title: "副本远征",
    desc: "1 点体力挑战 6 级副本，按战力门槛产出 AE / BF / MR / ES。",
    href: "/game/dungeons",
  },
  {
    icon: FlaskConical,
    title: "符文合成",
    desc: "100% 成功率，材料 + $ADVENT 进入黑洞，铸造更稀有的冒险者。",
    href: "/game/synthesis",
  },
  {
    icon: Store,
    title: "内盘交易",
    desc: `USDT 挂卖，支持部分购买，统一 ${(MARKET_FEE * 100).toFixed(0)}% 手续费。`,
    href: "/game/market",
  },
  {
    icon: ScrollText,
    title: "推荐系统",
    desc: `自助绑定，直推 ${(REFERRAL_DIRECT * 100).toFixed(0)}% / 间推 ${(REFERRAL_INDIRECT * 100).toFixed(0)}%。`,
    href: "/game/referral",
  },
] as const

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/hero-rune-abyss.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>

        <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col items-start justify-center gap-6 px-5 py-16 sm:gap-8 sm:px-6 sm:py-24 lg:min-h-[88vh]">
          <Badge
            variant="outline"
            className="gap-2 border-primary/40 bg-primary/10 px-3 py-1 font-mono text-primary"
          >
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            BSC · Chain ID 56 · 公平发射
          </Badge>

          <div className="max-w-3xl space-y-4 sm:space-y-5">
            <h1 className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="text-glow-gold">Rune Abyss</span>
              <span className="block text-foreground/90">符 文 深 渊</span>
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
              零通胀链游 · 3 角色组队 · 每日挑战副本产出材料 · 纯 USDT 内盘流通 ·
              纯材料合成稀有冒险者。代币 <span className="text-primary">$ADVENT</span>，总量 10
              亿，公平发射。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="gap-2 font-medium">
              <Link href="/game">
                进入深渊
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/game/summon">
                <Sparkles className="size-4" aria-hidden />
                立即召唤
              </Link>
            </Button>
          </div>

          {/* 关键经济参数 */}
          <dl className="mt-6 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "代币总量", v: "10 亿", sub: "$ADVENT" },
              { k: "角色上限", v: TOTAL_CHAR_CAP.toLocaleString(), sub: "全服稀缺" },
              { k: "体力价格", v: `${ENERGY_PRICE_USDT} U`, sub: "新手可领 5 点" },
              { k: "副本等级", v: `${DUNGEONS.length} 阶`, sub: "战力门槛递增" },
            ].map((s) => (
              <div
                key={s.k}
                className="rounded-lg border border-border bg-card/60 p-4 backdrop-blur"
              >
                <dt className="text-xs uppercase tracking-widest text-muted-foreground">{s.k}</dt>
                <dd className="mt-1 font-serif text-2xl text-foreground">{s.v}</dd>
                <dd className="text-[11px] text-muted-foreground">{s.sub}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* RARITY STRIP */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Rarity Tiers
              </p>
              <h2 className="font-serif text-2xl">五阶冒险者 · 战力区间</h2>
            </div>
            <Link
              href="/game/summon"
              className="text-sm text-primary hover:underline underline-offset-4"
            >
              前往召唤 →
            </Link>
          </div>

          <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {RARITIES.map((r) => {
              const wrap: Record<1 | 2 | 3 | 4 | 5, string> = {
                1: "border-chart-1/40 from-chart-1/15",
                2: "border-chart-2/40 from-chart-2/15",
                3: "border-chart-3/40 from-chart-3/15",
                4: "border-chart-4/50 from-chart-4/20",
                5: "border-chart-5/50 from-chart-5/20",
              }
              const text: Record<1 | 2 | 3 | 4 | 5, string> = {
                1: "text-chart-1",
                2: "text-chart-2",
                3: "text-chart-3",
                4: "text-chart-4",
                5: "text-chart-5",
              }
              return (
                <li
                  key={r.level}
                  className={`group overflow-hidden rounded-xl border bg-gradient-to-br to-transparent ${wrap[r.tone]}`}
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <Image
                      src={r.image || "/placeholder.svg"}
                      alt={`${r.name} 立绘`}
                      fill
                      sizes="(max-width: 768px) 50vw, 220px"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/70 to-transparent" />
                    <div className={`absolute left-3 top-3 rounded-md border bg-background/70 px-2 py-0.5 font-mono text-[10px] backdrop-blur ${text[r.tone]} border-current/40`}>
                      Lv.{r.level} · {(r.prob * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-serif text-base leading-tight">{r.name}</div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">战力</span>
                      <span className={`font-mono text-lg ${text[r.tone]}`}>
                        {r.powerMin} – {r.powerMax}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 flex flex-col items-start gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Core Loop</p>
          <h2 className="font-serif text-3xl text-balance">六大模块构成的零通胀闭环</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.title} href={f.href} className="group">
              <Card className="h-full border-border bg-card/60 transition group-hover:border-primary/40 group-hover:bg-card">
                <CardContent className="flex h-full flex-col gap-3 p-6">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                    <f.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="font-serif text-xl">{f.title}</h3>
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  <span className="mt-2 flex items-center gap-1 text-xs text-primary">
                    了解更多
                    <ArrowRight className="size-3 transition group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ECONOMY */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-6 sm:py-16 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Economy</p>
            <h2 className="mt-2 font-serif text-3xl">零通胀 · 通缩 · 内盘流通</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              材料只能通过副本掉落，不可铸造；合成消耗的材料与代币 100% 进入黑洞地址，玩家以
              USDT 为媒介在内盘自由交易。每一次抽取、合成、购买体力都让代币与材料离开流通。
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { k: "通胀", v: "0", sub: "材料无增发" },
                { k: "销毁", v: "100%", sub: "合成入黑洞" },
                { k: "手续费", v: `${(MARKET_FEE * 100).toFixed(0)}%`, sub: "内盘交易" },
              ].map((s) => (
                <div key={s.k} className="rounded-lg border border-border bg-background/60 p-4">
                  <dt className="text-xs text-muted-foreground">{s.k}</dt>
                  <dd className="font-serif text-2xl text-primary">{s.v}</dd>
                  <dd className="text-[11px] text-muted-foreground">{s.sub}</dd>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/40 via-background/20 to-card/40">
            <RuneSigil className="absolute inset-0 h-full w-full" spin opacity={0.9} />
            <div className="absolute inset-0 bg-gradient-to-tr from-background/40 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
              <div>
                <div className="font-serif text-2xl text-glow-gold">$ADVENT</div>
                <div className="text-xs text-muted-foreground">公平发射 · 总量 1,000,000,000</div>
              </div>
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link href="/game">
                  <RuneAbyssLogo size={16} title={null} />
                  控制台
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-center text-xs text-muted-foreground sm:px-6 sm:text-left sm:flex-row">
          <div className="flex items-center gap-2">
            <Zap className="size-3.5 text-primary" aria-hidden />
            <span className="font-mono">Rune Abyss · 演示版（前端 Demo，无真实链上交互）</span>
          </div>
          <span>© 2026 · BSC</span>
        </div>
      </footer>
    </main>
  )
}
