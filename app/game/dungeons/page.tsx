"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Skull, Sword, Zap } from "lucide-react"

import { TopBar } from "@/components/game/top-bar"
import { MaterialIcon } from "@/components/game/material-icon"
import { BattleModal } from "@/components/game/battle-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useGame } from "@/components/providers/game-provider"
import {
  DUNGEONS,
  DUNGEON_NAMES,
  ENERGY_PRICE_USDT,
  MATERIAL_KEYS,
} from "@/lib/game-data"

export default function DungeonsPage() {
  const {
    connected,
    connect,
    energy,
    teams,
    characters,
    challenge,
    buyEnergy,
    usdt,
  } = useGame()

  const [target, setTarget] = React.useState<number | null>(null)
  const [buyOpen, setBuyOpen] = React.useState(false)
  const [buyAmount, setBuyAmount] = React.useState(10)

  // 战斗动画状态：选了队伍后进入战斗，胜利领取战利品时才真正调用 challenge()
  const [battle, setBattle] = React.useState<{
    teamId: string
    dungeonLevel: number
  } | null>(null)

  const charById = React.useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters])
  const teamPower = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId)
    if (!team) return 0
    return team.characterIds.reduce((s, id) => s + (charById.get(id)?.power ?? 0), 0)
  }

  const targetDungeon = DUNGEONS.find((d) => d.level === target) ?? null

  const eligibleTeams = teams.filter((t) => {
    if (!targetDungeon) return false
    if (t.cooldownUntil > Date.now()) return false
    return teamPower(t.id) >= targetDungeon.minPower
  })

  const handleChallenge = (teamId: string) => {
    if (!target) return
    // 不立即结算 — 先关闭"选队伍"对话框，进入战斗动画
    setBattle({ teamId, dungeonLevel: target })
    setTarget(null)
  }

  // 战斗胜利后玩家点击"领取战利品" → 真正结算
  const settleBattle = () => {
    if (!battle) return
    challenge(battle.teamId, battle.dungeonLevel)
  }

  const battleDungeon = battle
    ? DUNGEONS.find((d) => d.level === battle.dungeonLevel) ?? null
    : null
  const battleTeam = battle ? teams.find((t) => t.id === battle.teamId) ?? null : null
  const battleHeroes = battleTeam
    ? (battleTeam.characterIds
        .map((id) => characters.find((c) => c.id === id))
        .filter(Boolean) as typeof characters)
    : []

  const handleBuyEnergy = () => {
    if (buyAmount > 0) {
      const ok = buyEnergy(buyAmount)
      if (ok) setBuyOpen(false)
    }
  }

  return (
    <>
      <TopBar title="副本远征" description="消耗体力挑战副本，获得四种核心材料" />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {!connected ? (
          <Empty className="border border-dashed border-border bg-card/40">
            <EmptyHeader>
              <EmptyTitle>请先连接钱包</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={connect}>连接钱包</Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Energy bar */}
            <Card className="border-border bg-card/60">
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-lg border border-chart-2/40 bg-chart-2/10 text-chart-2">
                    <Zap className="size-6" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Energy
                    </p>
                    <p className="font-serif text-2xl">
                      {energy} <span className="text-sm text-muted-foreground">点</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                  <p className="order-2 text-[11px] text-muted-foreground sm:order-1 sm:text-xs">
                    单价 {ENERGY_PRICE_USDT} USDT · 推荐人分润 15%
                  </p>
                  <Button
                    onClick={() => setBuyOpen(true)}
                    className="order-1 ml-auto gap-2 sm:order-2 sm:ml-0"
                    size="sm"
                  >
                    <Plus className="size-4" aria-hidden />
                    购买体力
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dungeon grid */}
            <section>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Abyss</p>
              <h2 className="font-serif text-2xl">六阶副本</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                每次挑战消耗 1 点体力，副本越深产出越稀有。挑战后队伍 24h 冷却。
              </p>

              <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {DUNGEONS.map((d) => {
                  const eligible = teams.some(
                    (t) =>
                      t.cooldownUntil <= Date.now() &&
                      teamPower(t.id) >= d.minPower,
                  )
                  return (
                    <li key={d.level}>
                      <Card className="group h-full overflow-hidden border-border bg-card/60 p-0">
                        <div className="relative aspect-[16/10] w-full overflow-hidden">
                          <Image
                            src={d.image || "/placeholder.svg"}
                            alt={`${d.name} 副本场景`}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover transition duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
                          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
                            <p className="rounded-md border border-primary/40 bg-background/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary backdrop-blur">
                              Dungeon {d.level}
                            </p>
                            <Badge
                              variant={eligible ? "default" : "secondary"}
                              className="font-mono backdrop-blur"
                            >
                              战力 ≥ {d.minPower}
                            </Badge>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 p-4">
                            <h3 className="font-serif text-2xl text-balance text-foreground drop-shadow-lg">
                              {d.name}
                            </h3>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Skull className="size-3.5 text-chart-5" aria-hidden />
                              <span>BOSS · {d.bossName}</span>
                            </p>
                          </div>
                        </div>

                        <CardContent className="flex flex-col gap-4 p-5">
                          <p className="text-[12px] leading-relaxed text-muted-foreground text-pretty">
                            {d.description}
                          </p>

                          <ul className="grid grid-cols-2 gap-2">
                            {MATERIAL_KEYS.map((k) => {
                              const v = d.output[k]
                              return (
                                <li
                                  key={k}
                                  className={`flex items-center justify-between rounded-lg border p-2 ${
                                    v > 0
                                      ? "border-border bg-background/40"
                                      : "border-border/40 bg-background/20 opacity-40"
                                  }`}
                                >
                                  <MaterialIcon material={k} size="sm" />
                                  <span className="font-mono text-sm">+{v}</span>
                                </li>
                              )
                            })}
                          </ul>

                          <Button
                            className="gap-2"
                            disabled={energy < 1 || !eligible}
                            onClick={() => setTarget(d.level)}
                          >
                            <Sword className="size-4" aria-hidden />
                            挑战
                          </Button>

                          {!eligible ? (
                            <p className="text-[11px] text-muted-foreground">
                              没有足够战力或队伍冷却中
                            </p>
                          ) : null}
                        </CardContent>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>
        )}
      </main>

      {/* Choose team dialog */}
      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              选择出征队伍 · {targetDungeon ? DUNGEON_NAMES[targetDungeon.level] : ""}
            </DialogTitle>
            <DialogDescription>
              {targetDungeon
                ? `战力门槛 ≥ ${targetDungeon.minPower}，消耗 1 点体力`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {eligibleTeams.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>没有可派出的队伍</EmptyTitle>
                <EmptyDescription>
                  战力不足或所有队伍冷却中，先去组建更强的小队吧。
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button asChild variant="outline">
                  <Link href="/game/teams">前往队伍编成</Link>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {eligibleTeams.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => handleChallenge(t.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-background/40 p-4 text-left transition hover:border-primary/40 hover:bg-card"
                  >
                    <div>
                      <div className="font-serif text-base">{t.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{t.id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        总战力
                      </div>
                      <div className="font-mono text-xl text-primary">
                        {teamPower(t.id)}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* Battle modal — 战斗动画 + 战利品 */}
      <BattleModal
        open={!!battle}
        onClose={() => setBattle(null)}
        dungeon={battleDungeon}
        characters={battleHeroes}
        onClaim={settleBattle}
      />

      {/* Buy energy dialog */}
      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">购买体力</DialogTitle>
            <DialogDescription>
              单价 {ENERGY_PRICE_USDT} USDT/点 · 直推 10% / 间推 5% 自动分润
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="energy-amount">数量</FieldLabel>
              <Input
                id="energy-amount"
                type="number"
                min={1}
                value={buyAmount}
                onChange={(e) => setBuyAmount(Math.max(1, parseInt(e.target.value) || 0))}
              />
            </Field>
          </FieldGroup>

          <div className="rounded-lg border border-border bg-background/40 p-4 text-sm">
            <Row label="支付总额" value={`${(buyAmount * ENERGY_PRICE_USDT).toFixed(2)} USDT`} highlight />
            <Row label="当前 USDT" value={usdt.toFixed(2)} />
            <Row
              label="推荐人分润"
              value={`${(buyAmount * ENERGY_PRICE_USDT * 0.15).toFixed(3)} USDT`}
              muted
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleBuyEnergy}
              disabled={usdt < buyAmount * ENERGY_PRICE_USDT || buyAmount < 1}
              className="gap-2"
            >
              <Zap className="size-4" aria-hidden />
              确认购买
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Row({
  label,
  value,
  highlight,
  muted,
}: {
  label: string
  value: string
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-mono ${
          highlight ? "text-primary font-semibold" : muted ? "text-muted-foreground" : ""
        }`}
      >
        {value}
      </span>
    </div>
  )
}
