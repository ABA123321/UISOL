"use client"

import * as React from "react"
import Image from "next/image"
import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import { RuneAbyssLogo } from "@/components/brand/rune-abyss-logo"
import { RuneSigil } from "@/components/brand/rune-sigil"
import { TopBar } from "@/components/game/top-bar"
import { SummonAnimationModal } from "@/components/game/summon-animation-modal"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useGame } from "@/components/providers/game-provider"
import { RARITIES, RARITY_BY_LEVEL, SUMMON_TIER_SIZE } from "@/lib/game-data"
import type { RarityLevel } from "@/lib/game-data"
import type { Character } from "@/components/providers/game-provider"

const COUNT_OPTIONS = [1, 5, 10] as const

/**
 * 召唤阵站位 — 中央为传奇，依次向两侧对称弱化，营造"金字塔"结构。
 * heightCls 控制每个立绘相对于召唤阵的高度，传奇最高凸出。
 */
const SUMMON_LINEUP: Array<{
  level: RarityLevel
  heightCls: string
  zCls: string
}> = [
  { level: 1, heightCls: "h-44 sm:h-52", zCls: "z-10" },
  { level: 3, heightCls: "h-56 sm:h-64", zCls: "z-20" },
  { level: 5, heightCls: "h-64 sm:h-[19rem]", zCls: "z-40" },
  { level: 4, heightCls: "h-60 sm:h-72", zCls: "z-30" },
  { level: 2, heightCls: "h-48 sm:h-56", zCls: "z-10" },
]

const TONE_BORDER: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "ring-chart-1/40",
  2: "ring-chart-2/50",
  3: "ring-chart-3/60",
  4: "ring-chart-4/70",
  5: "ring-chart-5/80",
}

const TONE_TEXT: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "text-chart-1",
  2: "text-chart-2",
  3: "text-chart-3",
  4: "text-chart-4",
  5: "text-chart-5",
}

const TONE_GLOW: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "",
  2: "shadow-[0_0_20px_-6px_oklch(0.72_0.13_195/0.55)]",
  3: "shadow-[0_0_24px_-6px_oklch(0.7_0.13_230/0.55)]",
  4: "shadow-[0_0_30px_-4px_oklch(0.8_0.15_80/0.7)]",
  5: "shadow-[0_0_40px_-4px_oklch(0.7_0.18_35/0.85)]",
}

export default function SummonPage() {
  const {
    connected,
    advent,
    characters,
    globalSummoned,
    charCap,
    currentSummonCost,
    summon,
  } = useGame()
  const [count, setCount] = React.useState<number>(1)
  const [animOpen, setAnimOpen] = React.useState(false)
  const [pendingCount, setPendingCount] = React.useState(1)
  // 在动画期间监听 characters 数组增长，把新角色喂给弹窗
  const beforeLenRef = React.useRef(0)
  const [animResult, setAnimResult] = React.useState<Character[] | null>(null)

  const total = currentSummonCost * count
  const canAfford = advent >= total
  const rolling = animOpen
  const summonedPct = Math.min(100, (globalSummoned / charCap) * 100)
  const tier = Math.floor(globalSummoned / SUMMON_TIER_SIZE)
  const nextTierIn = SUMMON_TIER_SIZE - (globalSummoned % SUMMON_TIER_SIZE)

  const handleSummon = () => {
    if (!connected || !canAfford) return
    beforeLenRef.current = characters.length
    setPendingCount(count)
    setAnimResult(null)
    setAnimOpen(true)
  }

  // 当 characters 数组在动画期间增长 → 把最新的 N 张作为本次召唤产物
  React.useEffect(() => {
    if (!animOpen) return
    if (animResult) return
    const before = beforeLenRef.current
    if (characters.length > before) {
      const fresh = characters.slice(0, characters.length - before)
      setAnimResult(fresh)
    }
  }, [animOpen, animResult, characters])

  const commitSummon = () => {
    summon(pendingCount)
  }

  return (
    <>
      <TopBar title="符文召唤" description="消耗 $ADVENT 抽取冒险者卡牌" />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left: hero summon */}
          <section className="flex flex-col gap-6">
            <Card className="overflow-hidden border-border bg-card/40 p-0">
              <CardContent className="p-0">
                {/* === 召唤阵 === */}
                <div className="relative isolate overflow-hidden">
                  {/* 背景：神秘符文圆 */}
                  <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
                    <div
                      className={cn(
                        "absolute left-1/2 top-1/2 aspect-square w-[120%] -translate-x-1/2 -translate-y-1/2 transition duration-700",
                        rolling && "scale-110",
                      )}
                    >
                      <RuneSigil
                        spin
                        opacity={rolling ? 0.85 : 0.55}
                        className={cn("h-full w-full", rolling && "animate-pulse")}
                      />
                    </div>
                  </div>

                  {/* 背景：金色雾气 */}
                  <div
                    className="pointer-events-none absolute inset-0 -z-10"
                    style={{
                      background:
                        "radial-gradient(ellipse 70% 60% at 50% 70%, oklch(0.8 0.15 80 / 0.28), transparent 70%)",
                    }}
                    aria-hidden
                  />

                  {/* 顶部装饰横条 */}
                  <div className="flex items-center justify-between gap-3 px-6 pt-5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" aria-hidden />
                      <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary">
                        Summoning Circle
                      </span>
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                      5 ranks · 5 souls
                    </span>
                  </div>

                  {/* 5 立绘站位 */}
                  <div className="relative flex items-end justify-center gap-1 px-2 pt-4 sm:gap-2 sm:px-6">
                    {SUMMON_LINEUP.map(({ level, heightCls, zCls }) => {
                      const r = RARITY_BY_LEVEL[level]
                      const isCenter = level === 5
                      return (
                        <div
                          key={level}
                          className={cn(
                            "group relative flex-1 overflow-hidden rounded-t-2xl border border-border/40 bg-background/40 ring-1 transition duration-500",
                            heightCls,
                            zCls,
                            TONE_BORDER[r.tone],
                            TONE_GLOW[r.tone],
                            "max-w-[22%]",
                            rolling && "animate-pulse",
                            !rolling && isCenter && "hover:-translate-y-1",
                          )}
                          aria-label={`${r.name} · 概率 ${(r.prob * 100).toFixed(0)}%`}
                        >
                          <Image
                            src={r.image || "/placeholder.svg"}
                            alt={`${r.name} 立绘`}
                            fill
                            sizes="(max-width: 640px) 22vw, 160px"
                            className="object-cover object-top"
                            priority={level >= 4}
                          />
                          {/* 顶部渐隐 */}
                          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background/70 to-transparent" />
                          {/* 底部渐隐 + 标签 */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/85 to-transparent p-2">
                            <div
                              className={cn(
                                "font-serif text-xs leading-tight sm:text-sm",
                                TONE_TEXT[r.tone],
                              )}
                            >
                              {r.short}
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {(r.prob * 100).toFixed(0)}%
                            </div>
                          </div>
                          {/* 传奇皇冠星标 */}
                          {isCenter ? (
                            <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full border border-chart-5/60 bg-background/80 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-chart-5 backdrop-blur">
                              ★ Legendary
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>

                  {/* 底部地面光带 */}
                  <div
                    className={cn(
                      "relative h-1.5 w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent transition-opacity",
                      rolling ? "opacity-100" : "opacity-50",
                    )}
                    aria-hidden
                  />
                </div>

                {/* === 价格 + 召唤按钮 === */}
                <div className="border-t border-border bg-background/60 px-6 py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Cost per summon
                      </p>
                      <p className="mt-1 font-serif text-3xl text-glow-gold">
                        {currentSummonCost.toLocaleString()}{" "}
                        <span className="text-base text-muted-foreground">$ADVENT</span>
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <ButtonGroup>
                        {COUNT_OPTIONS.map((n) => (
                          <Button
                            key={n}
                            variant={count === n ? "default" : "outline"}
                            onClick={() => setCount(n)}
                            className="px-4"
                          >
                            ×{n}
                          </Button>
                        ))}
                      </ButtonGroup>
                      <Button
                        size="lg"
                        disabled={!connected || !canAfford || rolling}
                        onClick={handleSummon}
                        className="gap-2"
                      >
                        <RuneAbyssLogo size={16} title={null} />
                        {rolling
                          ? "召唤中…"
                          : `召唤 ×${count} · ${total.toLocaleString()} $ADVENT`}
                      </Button>
                      {!connected ? (
                        <p className="text-right text-xs text-muted-foreground">请先连接钱包</p>
                      ) : !canAfford ? (
                        <p className="text-right text-xs text-destructive">$ADVENT 不足</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Probability table */}
            <Card className="border-border bg-card/60">
              <CardContent className="p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Probability
                </p>
                <h2 className="mt-1 font-serif text-xl">稀有度概率</h2>
                <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {RARITIES.map((r) => {
                    const toneDot: Record<1 | 2 | 3 | 4 | 5, string> = {
                      1: "bg-chart-1",
                      2: "bg-chart-2",
                      3: "bg-chart-3",
                      4: "bg-chart-4",
                      5: "bg-chart-5",
                    }
                    return (
                      <li
                        key={r.level}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`size-2.5 rounded-full ${toneDot[r.tone]}`}
                            aria-hidden
                          />
                          <div>
                            <div className="font-serif text-sm">{r.name}</div>
                            <div className="text-[11px] text-muted-foreground">
                              战力 {r.powerMin} – {r.powerMax}
                            </div>
                          </div>
                        </div>
                        <span className="font-mono text-base">
                          {(r.prob * 100).toFixed(0)}%
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Right: meta info */}
          <aside className="flex flex-col gap-4">
            <Card className="border-border bg-card/60">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Supply</p>
                <h3 className="mt-1 font-serif text-lg">全服铸造进度</h3>
                <div className="mt-3 flex items-baseline justify-between font-mono">
                  <span className="text-2xl text-primary">{globalSummoned.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">
                    / {charCap.toLocaleString()}
                  </span>
                </div>
                <Progress value={summonedPct} className="mt-2 h-2" />
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">当前阶梯</span>
                    <span className="font-mono">
                      第 {tier + 1} 阶 (+{(tier * 10).toFixed(0)}%)
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">距下一次涨价</span>
                    <span className="font-mono">{nextTierIn} 个</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">单价</span>
                    <span className="font-mono text-primary">
                      {currentSummonCost.toLocaleString()}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/60">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Roster</p>
                <h3 className="mt-1 font-serif text-lg">我的冒险者</h3>
                <p className="mt-2 text-3xl font-serif">{characters.length}</p>
                <p className="text-[11px] text-muted-foreground">已拥有 / 全服上限 6,000</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/60">
              <CardContent className="p-5 text-sm leading-relaxed text-muted-foreground">
                <p>
                  <span className="text-primary">召唤即销毁</span>
                  ：消耗的 $ADVENT 直接进入项目销毁地址，提升代币稀缺性。每 1000 个角色后单价
                  +10%，全服共 6,000 抽完即止。
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {/* 召唤动画弹窗 */}
      <SummonAnimationModal
        open={animOpen}
        onClose={() => {
          setAnimOpen(false)
          setAnimResult(null)
        }}
        pendingCount={pendingCount}
        newCharacters={animResult}
        onCommit={commitSummon}
      />
    </>
  )
}
