"use client"

import * as React from "react"
import { FlaskConical, Skull } from "lucide-react"

import { RuneAbyssLogo } from "@/components/brand/rune-abyss-logo"
import { TopBar } from "@/components/game/top-bar"
import { MaterialIcon } from "@/components/game/material-icon"
import { SynthesisAnimationModal } from "@/components/game/synthesis-animation-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { useGame, type Character } from "@/components/providers/game-provider"
import {
  MATERIAL_KEYS,
  RARITY_BY_LEVEL,
  SYNTHESIS_COSTS,
  type MaterialKey,
  type RarityLevel,
} from "@/lib/game-data"

export default function SynthesisPage() {
  const { connected, connect, advent, inventory, synthesize, characters } = useGame()

  // 合成动画状态
  const [animLevel, setAnimLevel] = React.useState<RarityLevel | null>(null)
  const [animOpen, setAnimOpen] = React.useState(false)
  const [animResult, setAnimResult] = React.useState<Character | null>(null)
  const beforeLenRef = React.useRef(0)

  const startSynthesis = (level: RarityLevel) => {
    beforeLenRef.current = characters.length
    setAnimLevel(level)
    setAnimResult(null)
    setAnimOpen(true)
  }

  // 监听 characters 长度增长 → 把新合成的角色作为 prop 传入
  React.useEffect(() => {
    if (!animOpen) return
    if (animResult) return
    if (characters.length > beforeLenRef.current) {
      setAnimResult(characters[0]) // synthesize unshift 到首位
    }
  }, [animOpen, animResult, characters])

  const commitSynthesis = () => {
    if (animLevel == null) return
    synthesize(animLevel)
  }

  return (
    <>
      <TopBar title="符文合成" description="100% 成功 · 销毁全部进入黑洞地址" />

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
            {/* Inventory */}
            <Card className="border-border bg-card/60">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Inventory
                </p>
                <h2 className="font-serif text-xl">材料库存</h2>
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {MATERIAL_KEYS.map((k) => (
                    <li
                      key={k}
                      className="flex items-center justify-between rounded-lg border border-border bg-background/40 p-3"
                    >
                      <MaterialIcon material={k} showLabel size="sm" />
                      <span className="font-mono text-lg">{inventory[k].toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between rounded-lg border border-border bg-background/40 p-3">
                  <div className="flex items-center gap-2 text-sm">
                          <RuneAbyssLogo size={16} title={null} />
                    <span className="text-muted-foreground">$ADVENT</span>
                  </div>
                  <span className="font-mono text-lg">{advent.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Synthesis cards */}
            <section>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Forge</p>
              <h2 className="font-serif text-2xl">五阶合成熔炉</h2>

              <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {SYNTHESIS_COSTS.map((cost) => {
                  const rarity = RARITY_BY_LEVEL[cost.level as RarityLevel]
                  const lacking: string[] = []
                  for (const k of MATERIAL_KEYS) {
                    if (inventory[k] < cost[k]) lacking.push(k)
                  }
                  const adventOk = advent >= cost.advent
                  const canCraft = lacking.length === 0 && adventOk

                  const tone = rarity.tone
                  const toneText: Record<1 | 2 | 3 | 4 | 5, string> = {
                    1: "text-chart-1",
                    2: "text-chart-2",
                    3: "text-chart-3",
                    4: "text-chart-4",
                    5: "text-chart-5",
                  }
                  const toneBorder: Record<1 | 2 | 3 | 4 | 5, string> = {
                    1: "border-chart-1/40",
                    2: "border-chart-2/40",
                    3: "border-chart-3/50",
                    4: "border-chart-4/60",
                    5: "border-chart-5/70",
                  }

                  return (
                    <li key={cost.level}>
                      <Card className={`h-full border bg-card/60 ${toneBorder[tone]}`}>
                        <CardContent className="flex h-full flex-col gap-4 p-5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`font-mono text-xs ${toneText[tone]}`}>
                                Lv.{cost.level} · {(rarity.prob * 100).toFixed(0)}% 自然概率
                              </p>
                              <h3 className="font-serif text-lg">{rarity.name}</h3>
                              <p className="text-[11px] text-muted-foreground">
                                战力 {rarity.powerMin} – {rarity.powerMax}
                              </p>
                            </div>
                            <span
                              className={`flex size-12 items-center justify-center rounded-lg border bg-background/60 ${toneBorder[tone]} ${toneText[tone]}`}
                              aria-hidden
                            >
                              <FlaskConical className="size-6" />
                            </span>
                          </div>

                          <ul className="grid grid-cols-2 gap-2">
                            {(MATERIAL_KEYS).map((k) => {
                              const need = cost[k as MaterialKey]
                              const have = inventory[k]
                              const ok = have >= need
                              return (
                                <li
                                  key={k}
                                  className={`flex items-center justify-between rounded-lg border p-2 ${
                                    ok ? "border-border bg-background/40" : "border-destructive/40 bg-destructive/5"
                                  }`}
                                >
                                  <MaterialIcon material={k} size="sm" />
                                  <div className="text-right">
                                    <div className={`font-mono text-sm ${ok ? "" : "text-destructive"}`}>
                                      {have} / {need}
                                    </div>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>

                          <div
                            className={`flex items-center justify-between rounded-lg border p-2 ${
                              adventOk
                                ? "border-border bg-background/40"
                                : "border-destructive/40 bg-destructive/5"
                            }`}
                          >
                            <span className="flex items-center gap-2 text-sm">
                              <RuneAbyssLogo size={14} title={null} />
                              <span className="text-muted-foreground">$ADVENT 销毁</span>
                            </span>
                            <span
                              className={`font-mono text-sm ${adventOk ? "" : "text-destructive"}`}
                            >
                              {advent.toLocaleString()} / {cost.advent.toLocaleString()}
                            </span>
                          </div>

                          <div className="mt-auto flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Skull className="size-3" aria-hidden />
                              全部进入黑洞地址
                            </span>
                            <Button
                              disabled={!canCraft || animOpen}
                              onClick={() => startSynthesis(cost.level as RarityLevel)}
                              className="gap-2"
                            >
                              <FlaskConical className="size-4" aria-hidden />
                              合成
                            </Button>
                          </div>
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

      {/* 合成动画 */}
      <SynthesisAnimationModal
        open={animOpen}
        level={animLevel}
        newCharacter={animResult}
        onCommit={commitSynthesis}
        onClose={() => {
          setAnimOpen(false)
          setAnimLevel(null)
          setAnimResult(null)
        }}
      />
    </>
  )
}
