"use client"

import * as React from "react"
import Image from "next/image"
import { Crown, Shield, Skull, Sword, Trophy, X, Zap } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { MaterialIcon } from "@/components/game/material-icon"
import type { Character } from "@/components/providers/game-provider"
import {
  CLASS_NAMES,
  MATERIAL_KEYS,
  RARITY_BY_LEVEL,
  type Dungeon,
} from "@/lib/game-data"

type Phase = "idle" | "intro" | "attack1" | "attack2" | "attack3" | "victory"

interface DamageNumber {
  id: number
  heroIndex: number
  amount: number
  critical: boolean
}

export interface BattleModalProps {
  open: boolean
  onClose: () => void
  dungeon: Dungeon | null
  characters: Character[]
  /** 战斗动画走完点"领取战利品"后调用，由父组件结算 */
  onClaim: () => void
}

/**
 * 副本战斗动画弹窗：
 * intro → attack1/2/3 → victory → loot
 * 总时长 ~4.5s，第三击为暴击有全屏闪 + Boss 倒下。
 */
export function BattleModal({ open, onClose, dungeon, characters, onClaim }: BattleModalProps) {
  const [phase, setPhase] = React.useState<Phase>("idle")
  const [bossHp, setBossHp] = React.useState(100)
  const [shake, setShake] = React.useState(0) // increments to retrigger
  const [critFlash, setCritFlash] = React.useState(false)
  const [damages, setDamages] = React.useState<DamageNumber[]>([])
  const dmgSeq = React.useRef(0)

  // 启动 / 重置时间线
  React.useEffect(() => {
    if (!open || !dungeon || characters.length < 3) {
      setPhase("idle")
      setBossHp(100)
      setShake(0)
      setCritFlash(false)
      setDamages([])
      dmgSeq.current = 0
      return
    }

    const teamPower = characters.reduce((s, c) => s + c.power, 0)
    // 三击伤害分布：依据队伍战力做点小变化
    const base = teamPower
    const dmg1 = Math.round(base * 0.32)
    const dmg2 = Math.round(base * 0.34)
    const dmg3 = base - dmg1 - dmg2 // 致命一击
    const total = dmg1 + dmg2 + dmg3
    // Boss 总血 = 攻击者总伤害（确保第三击归零，戏剧化）
    const max = total

    const pushDmg = (heroIndex: number, amount: number, critical: boolean) => {
      dmgSeq.current += 1
      const id = dmgSeq.current
      setDamages((d) => [...d, { id, heroIndex, amount, critical }])
      // 1.4s 后清理这条数字
      window.setTimeout(() => {
        setDamages((d) => d.filter((x) => x.id !== id))
      }, 1400)
    }

    const triggerShake = () => setShake((n) => n + 1)

    // 时间线（毫秒）
    const timeline: Array<{ at: number; fn: () => void }> = [
      { at: 0, fn: () => setPhase("intro") },
      {
        at: 900,
        fn: () => {
          setPhase("attack1")
          triggerShake()
          pushDmg(0, dmg1, false)
          // HP drain 同步发生
          window.setTimeout(() => {
            setBossHp(Math.max(0, Math.round(((max - dmg1) / max) * 100)))
          }, 250)
        },
      },
      {
        at: 2100,
        fn: () => {
          setPhase("attack2")
          triggerShake()
          pushDmg(1, dmg2, false)
          window.setTimeout(() => {
            setBossHp(Math.max(0, Math.round(((max - dmg1 - dmg2) / max) * 100)))
          }, 250)
        },
      },
      {
        at: 3300,
        fn: () => {
          setPhase("attack3")
          triggerShake()
          setCritFlash(true)
          pushDmg(2, dmg3, true)
          window.setTimeout(() => {
            setBossHp(0)
            setCritFlash(false)
          }, 350)
        },
      },
      { at: 4900, fn: () => setPhase("victory") },
    ]

    const ids = timeline.map((t) => window.setTimeout(t.fn, t.at))
    return () => ids.forEach((id) => window.clearTimeout(id))
  }, [open, dungeon, characters])

  if (!dungeon) return null

  const heroes = characters.slice(0, 3)
  const inAttack =
    phase === "attack1" || phase === "attack2" || phase === "attack3"
  const bossDefeated = phase === "victory"
  const teamPower = heroes.reduce((s, c) => s + c.power, 0)

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <DialogContent
        className="max-h-[95vh] max-w-3xl overflow-hidden border border-primary/30 p-0"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{dungeon.name} 副本战斗</DialogTitle>

        {/* Stage */}
        <div
          key={shake}
          className={cn(
            "relative aspect-[16/10] w-full overflow-hidden",
            shake > 0 && "animate-[battle-shake_0.32s_ease-out]",
          )}
        >
          {/* 副本场景背景 */}
          <Image
            src={dungeon.image || "/placeholder.svg"}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
          {/* 暗化 + 双侧 vignette — 弱化中心，留出舞台亮度 */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/30 via-transparent to-background/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,oklch(0.14_0.012_240/0.45)_100%)]" />
          {/* 顶部金色氛围光 */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.84 0.16 80 / 0.18), transparent 60%)",
            }}
          />

          {/* 顶部信息条 */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 sm:p-4">
            <div>
              <p className="rounded-md border border-primary/40 bg-background/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary backdrop-blur">
                Dungeon {dungeon.level}
              </p>
              <h3 className="mt-1.5 font-serif text-base text-balance text-foreground drop-shadow sm:text-xl">
                {dungeon.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="flex size-8 items-center justify-center rounded-md border border-border/60 bg-background/60 text-muted-foreground backdrop-blur hover:bg-background hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          {/* Boss 区 — 右上 */}
          <div className="absolute right-3 top-14 z-10 flex w-[44%] max-w-[260px] flex-col items-end gap-2 sm:right-6 sm:top-16 sm:w-[40%]">
            <div className="w-full">
              <div className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
                <span className="flex items-center gap-1.5 text-chart-5">
                  <Skull className="size-3.5" aria-hidden />
                  Boss
                </span>
                <span className="font-mono text-foreground">{bossHp}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full border border-chart-5/40 bg-chart-5/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-chart-5 to-chart-4 transition-all duration-500 ease-out"
                  style={{ width: `${bossHp}%`, animation: "hp-drain 0.5s ease-out" }}
                />
              </div>
              <p className="mt-1 truncate text-right font-serif text-sm text-foreground drop-shadow sm:text-base">
                {dungeon.bossName}
              </p>
            </div>

            <div
              className={cn(
                "relative aspect-square w-full max-w-[180px] overflow-hidden rounded-2xl border border-chart-5/40",
                phase === "attack1" || phase === "attack2"
                  ? "animate-[boss-recoil_0.7s_ease-out]"
                  : "",
                phase === "attack3" || bossDefeated
                  ? "animate-[boss-defeat_1.1s_ease-out_forwards]"
                  : "",
              )}
            >
              {/* Boss 立绘 — 用副本场景图做 silhouette + 红光 */}
              <Image
                src={dungeon.image || "/placeholder.svg"}
                alt={`${dungeon.bossName} 剪影`}
                fill
                sizes="180px"
                className="scale-150 object-cover"
                style={{ objectPosition: "center 35%" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-chart-5/40 via-background/40 to-background/10 mix-blend-multiply" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,oklch(0.7_0.18_35/0.4)_0%,transparent_60%)]" />
            </div>
          </div>

          {/* 队员区 — 左下 */}
          <div className="absolute inset-x-3 bottom-3 z-10 flex justify-start gap-2 sm:inset-x-6 sm:bottom-6">
            {heroes.map((c, i) => {
              const r = RARITY_BY_LEVEL[c.rarity]
              const className = CLASS_NAMES[c.classIndex] ?? "冒险者"
              const isAttacking =
                (phase === "attack1" && i === 0) ||
                (phase === "attack2" && i === 1) ||
                (phase === "attack3" && i === 2)
              return (
                <div
                  key={c.id}
                  className={cn(
                    "relative flex w-[30%] max-w-[150px] flex-col gap-1.5",
                    isAttacking &&
                      "animate-[hero-charge_0.95s_cubic-bezier(.5,-0.2,.4,1.2)]",
                  )}
                >
                  <div
                    className={cn(
                      "relative aspect-[3/4] overflow-hidden rounded-xl border-2 bg-card/60 shadow-[0_8px_24px_oklch(0_0_0/0.5)]",
                      i === 0 && "border-chart-2/60",
                      i === 1 && "border-chart-3/60",
                      i === 2 && "border-chart-4/70",
                    )}
                  >
                    <Image
                      src={r.image || "/placeholder.svg"}
                      alt=""
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                    <div className="absolute left-1.5 top-1.5 rounded-md border border-primary/40 bg-background/70 px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-primary backdrop-blur">
                      {r.short}
                    </div>
                    {isAttacking ? (
                      <span
                        className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-chart-4 text-background shadow-[0_0_12px_oklch(0.8_0.15_80/0.8)]"
                        aria-hidden
                      >
                        <Sword className="size-3" />
                      </span>
                    ) : null}
                    <div className="absolute inset-x-1.5 bottom-1.5">
                      <div className="truncate font-serif text-[11px] text-foreground drop-shadow sm:text-xs">
                        {className}
                      </div>
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                        <span className="text-muted-foreground">战力</span>
                        <span className="font-mono text-primary">{c.power}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 中央：剑光斩击特效 */}
          {inAttack ? (
            <div
              key={`slash-${phase}`}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
              aria-hidden
            >
              <div className="relative size-[60%]">
                <div
                  className="absolute inset-0 rounded-full bg-[linear-gradient(125deg,transparent_42%,oklch(0.98_0.02_85/0.85)_50%,transparent_58%)] animate-[slash-sweep_0.55s_ease-out]"
                  style={{ filter: "blur(2px)" }}
                />
                <div className="absolute inset-0 animate-[slash-sweep_0.55s_ease-out_0.05s] rounded-full bg-[linear-gradient(125deg,transparent_45%,oklch(0.8_0.15_80/0.9)_50%,transparent_55%)]" />
              </div>
            </div>
          ) : null}

          {/* 第三击：全屏暴击闪 + 中心爆炸圆 */}
          {critFlash ? (
            <>
              <div
                className="pointer-events-none absolute inset-0 z-30 bg-primary/70 mix-blend-screen animate-[crit-flash_0.6s_ease-out]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute left-[68%] top-[42%] z-30 size-32 rounded-full bg-[radial-gradient(circle,oklch(0.95_0.15_80/0.95)_0%,oklch(0.7_0.18_35/0.6)_40%,transparent_70%)] animate-[crit-burst_0.7s_ease-out]"
                aria-hidden
              />
            </>
          ) : null}

          {/* 飞起的伤害数字（每个挂在中央偏右，对应 Boss 位置） */}
          {damages.map((d) => (
            <div
              key={d.id}
              className={cn(
                "pointer-events-none absolute z-30 left-[68%] top-[36%] -translate-x-1/2 font-serif font-bold animate-[dmg-float_1.2s_ease-out_forwards]",
                d.critical
                  ? "text-3xl text-chart-5 drop-shadow-[0_0_12px_oklch(0.7_0.18_35/0.9)] sm:text-5xl"
                  : "text-2xl text-foreground drop-shadow-[0_0_8px_oklch(0_0_0/0.9)] sm:text-4xl",
              )}
              aria-hidden
            >
              {d.critical ? `致命 -${d.amount}` : `-${d.amount}`}
            </div>
          ))}

          {/* 战斗中状态条 — intro / attack 阶段 */}
          {!bossDefeated ? (
            <div className="absolute bottom-3 right-3 z-10 sm:bottom-6 sm:right-6">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-2.5 py-1.5 font-mono text-[10px] backdrop-blur sm:px-3 sm:py-2 sm:text-xs">
                <Zap className="size-3 text-chart-2" aria-hidden />
                <span className="text-muted-foreground">队伍战力</span>
                <span className="text-primary">{teamPower}</span>
              </div>
            </div>
          ) : null}

          {/* VICTORY 横幅 */}
          {bossDefeated ? (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 z-40 animate-[victory-pop_0.6s_cubic-bezier(.4,1.6,.5,1)_forwards]"
              aria-hidden
            >
              <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-background/80 px-5 py-3 backdrop-blur-md ring-rune sm:px-7 sm:py-4">
                <Trophy className="size-7 text-primary sm:size-9" aria-hidden />
                <div className="flex flex-col leading-tight">
                  <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground sm:text-xs">
                    Victory
                  </span>
                  <span className="font-serif text-xl text-glow-gold sm:text-3xl">
                    挑战胜利
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* 底部：战利品 + 按钮 */}
        <div className="border-t border-border/60 bg-background/85 backdrop-blur">
          {bossDefeated ? (
            <div className="flex flex-col gap-3 p-4 sm:p-5 animate-[loot-rise_0.5s_ease-out]">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Loot
                </p>
                <span className="font-mono text-[11px] text-chart-2">+1 战斗记录</span>
              </div>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MATERIAL_KEYS.map((k) => {
                  const v = dungeon.output[k]
                  return (
                    <li
                      key={k}
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-2",
                        v > 0
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/40 bg-background/40 opacity-40",
                      )}
                    >
                      <MaterialIcon material={k} size="sm" />
                      <span className="font-mono text-sm text-primary">+{v}</span>
                    </li>
                  )
                })}
              </ul>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-muted-foreground">
                  队伍进入 24h 冷却 · 材料已计入背包
                </p>
                <Button
                  onClick={() => {
                    onClaim()
                    onClose()
                  }}
                  className="gap-2"
                >
                  <Crown className="size-4" aria-hidden />
                  领取战利品
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 p-4 text-xs sm:p-5">
              <div className="flex items-center gap-2">
                <Shield
                  className={cn(
                    "size-4 transition-colors",
                    phase === "intro" ? "text-muted-foreground" : "text-chart-2",
                  )}
                  aria-hidden
                />
                <span className="font-mono uppercase tracking-widest text-muted-foreground">
                  {phase === "intro"
                    ? "战斗准备中…"
                    : phase === "attack1"
                      ? "第一波 · 突进"
                      : phase === "attack2"
                        ? "第二波 · 连击"
                        : "致命一击 · 暴击！"}
                </span>
              </div>
              {/* 进度刻度 */}
              <div className="flex items-center gap-1">
                {(["attack1", "attack2", "attack3"] as Phase[]).map((p, i) => {
                  const done =
                    phase === "victory" ||
                    (phase === "attack1" && i === 0) ||
                    (phase === "attack2" && i <= 1) ||
                    (phase === "attack3" && i <= 2)
                  return (
                    <span
                      key={p}
                      className={cn(
                        "h-1.5 w-6 rounded-full transition-colors",
                        done ? "bg-primary shadow-[0_0_8px_oklch(0.8_0.15_80/0.7)]" : "bg-border",
                      )}
                      aria-hidden
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
