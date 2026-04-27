"use client"

import Link from "next/link"
import { ArrowRight, FlaskConical, Gift, Map, Sparkles, Store, Users, Zap } from "lucide-react"

import { RuneAbyssLogo } from "@/components/brand/rune-abyss-logo"
import { TopBar } from "@/components/game/top-bar"
import { MaterialIcon } from "@/components/game/material-icon"
import { CharacterCard } from "@/components/game/character-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { useGame } from "@/components/providers/game-provider"
import { MATERIAL_KEYS } from "@/lib/game-data"

export default function DashboardPage() {
  const {
    connected,
    connect,
    advent,
    usdt,
    energy,
    inventory,
    characters,
    teams,
    globalSummoned,
    charCap,
    currentSummonCost,
    newPlayerGiftClaimed,
    claimNewPlayerGift,
  } = useGame()

  const summonedPct = Math.min(100, (globalSummoned / charCap) * 100)
  const idleTeams = teams.filter((t) => t.cooldownUntil <= Date.now()).length

  return (
    <>
      <TopBar title="主控台" description="符文深渊 · 玩家概览" />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {!connected ? (
          <Empty className="border border-dashed border-border bg-card/40">
            <EmptyHeader>
              <EmptyMedia>
                <span className="flex size-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary ring-rune">
                  <Sparkles className="size-7" aria-hidden />
                </span>
              </EmptyMedia>
              <EmptyTitle className="font-serif text-2xl">连接你的 BSC 钱包</EmptyTitle>
              <EmptyDescription>
                连接后可在主控台领取 5 点新手体力 · 演示资源（25 万 $ADVENT / 50 USDT）随钱包到账
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={connect} size="lg" className="gap-2">
                <Sparkles className="size-4" aria-hidden />
                连接钱包并进入
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-col gap-6">
            {/* 新手礼包：未领取时占据一行突出展示 */}
            {!newPlayerGiftClaimed ? (
              <Card className="overflow-hidden border-primary/40 bg-gradient-to-br from-primary/12 via-card/60 to-card/40">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/40 bg-primary/15 text-primary ring-rune">
                      <Gift className="size-6" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">
                        Newcomer Gift
                      </p>
                      <h3 className="mt-1 font-serif text-lg sm:text-xl">
                        新手礼包 · 5 点体力
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                        每个钱包仅限一次。领取后立刻可挑战 1 级副本，开启第一笔材料产出。
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={claimNewPlayerGift}
                    size="lg"
                    className="w-full gap-2 sm:w-auto"
                  >
                    <Gift className="size-4" aria-hidden />
                    领取礼包
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {/* Stats grid */}
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<RuneAbyssLogo size={16} title={null} />}
                label="$ADVENT"
                value={advent.toLocaleString()}
                hint={`下一抽 ${currentSummonCost.toLocaleString()}`}
              />
              <StatCard
                icon={<span className="size-3 rounded-full bg-accent shadow-[0_0_8px_currentColor]" />}
                label="USDT"
                value={usdt.toFixed(2)}
                hint="用于体力 / 内盘交易"
              />
              <StatCard
                icon={<Zap className="size-4 text-chart-2" />}
                label="体力"
                value={energy.toString()}
                hint="0.5 USDT/点"
              />
              <StatCard
                icon={<Users className="size-4 text-primary" />}
                label="冒险者 / 队伍"
                value={`${characters.length} / ${teams.length}`}
                hint={`${idleTeams} 支待命中`}
              />
            </section>

            {/* Two-column quick actions + stats */}
            <section className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-border bg-card/60">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Materials
                      </p>
                      <h2 className="font-serif text-xl">材料库存</h2>
                    </div>
                    <Button asChild variant="outline" size="sm" className="gap-1">
                      <Link href="/game/market">
                        <Store className="size-3.5" aria-hidden />
                        前往内盘
                      </Link>
                    </Button>
                  </div>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {MATERIAL_KEYS.map((k) => (
                      <li
                        key={k}
                        className="flex items-center justify-between rounded-lg border border-border bg-background/50 p-3"
                      >
                        <MaterialIcon material={k} showLabel size="sm" />
                        <span className="font-mono text-lg">{inventory[k].toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 rounded-lg border border-border/60 bg-background/40 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">全服角色铸造进度</span>
                      <span className="font-mono">
                        {globalSummoned.toLocaleString()} / {charCap.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={summonedPct} className="h-2" />
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      每 1000 个角色后召唤价格 +10%。当前每个角色：
                      <span className="ml-1 font-mono text-primary">
                        {currentSummonCost.toLocaleString()} $ADVENT
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/60">
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Quick Travel
                  </p>
                  <h2 className="mt-1 font-serif text-xl">快速通道</h2>

                  <ul className="mt-4 flex flex-col gap-2">
                    {[
                      { href: "/game/summon", label: "召唤新角色", icon: Sparkles },
                      { href: "/game/teams", label: "组建队伍", icon: Users },
                      { href: "/game/dungeons", label: "前往副本", icon: Map },
                      { href: "/game/synthesis", label: "合成稀有", icon: FlaskConical },
                    ].map((q) => (
                      <li key={q.href}>
                        <Button asChild variant="ghost" className="h-auto w-full justify-between py-3">
                          <Link href={q.href}>
                            <span className="flex items-center gap-2">
                              <q.icon className="size-4 text-primary" aria-hidden />
                              {q.label}
                            </span>
                            <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Recent characters */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    Roster
                  </p>
                  <h2 className="font-serif text-xl">最近获得的冒险者</h2>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/game/teams">查看全部 ({characters.length})</Link>
                </Button>
              </div>
              {characters.length === 0 ? (
                <Empty className="border border-dashed border-border bg-card/40">
                  <EmptyHeader>
                    <EmptyTitle>还没有冒险者</EmptyTitle>
                    <EmptyDescription>前往召唤页面铸造你的第一支冒险者卡牌。</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button asChild>
                      <Link href="/game/summon">前往召唤</Link>
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {characters.slice(0, 6).map((c) => (
                    <CharacterCard key={c.id} character={c} size="sm" />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-serif text-2xl">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  )
}
