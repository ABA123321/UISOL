"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Sparkles, Sword, Trash2, Users } from "lucide-react"

import { TopBar } from "@/components/game/top-bar"
import { CharacterCard } from "@/components/game/character-card"
import { TeamFormationModal } from "@/components/game/team-formation-modal"
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
import { useGame, type Character } from "@/components/providers/game-provider"
import { CLASS_NAMES, MAX_TEAMS_PER_ACCOUNT, RARITY_BY_LEVEL } from "@/lib/game-data"

export default function TeamsPage() {
  const { characters, teams, createTeam, disbandTeam, connected, connect } = useGame()

  const [creating, setCreating] = React.useState(false)
  const [selected, setSelected] = React.useState<string[]>([])
  const [teamName, setTeamName] = React.useState("")
  // 组队仪式动画
  const [pactOpen, setPactOpen] = React.useState(false)

  const inUse = React.useMemo(() => new Set(teams.flatMap((t) => t.characterIds)), [teams])
  const available = React.useMemo(
    () => characters.filter((c) => !inUse.has(c.id)),
    [characters, inUse],
  )

  const togglePick = (id: string) => {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length >= 3 ? s : [...s, id],
    )
  }

  const charById = React.useMemo(() => new Map(characters.map((c) => [c.id, c])), [characters])
  const selectedChars = selected.map((id) => charById.get(id)).filter(Boolean) as Character[]
  const previewPower = selectedChars.reduce((s, c) => s + c.power, 0)

  // 第一步：用户点击"确认组队" → 关闭选人对话框，打开仪式动画
  const submit = () => {
    if (selected.length !== 3) return
    setCreating(false)
    setPactOpen(true)
  }

  // 第二步：仪式动画结束后用户点击"缔结契约" → 真正创建队伍
  const sealPact = () => {
    if (selected.length !== 3) return
    const ok = createTeam(selected as [string, string, string], teamName)
    if (ok) {
      setPactOpen(false)
      setSelected([])
      setTeamName("")
    }
  }

  // 取消仪式 → 返回选人界面
  const cancelPact = () => {
    setPactOpen(false)
    setCreating(true)
  }

  return (
    <>
      <TopBar
        title="队伍编成"
        description={`3 角色组队，${MAX_TEAMS_PER_ACCOUNT} 队上限 · 单队 24h 冷却`}
      />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {!connected ? (
          <UnconnectedHint onConnect={connect} />
        ) : characters.length === 0 ? (
          <Empty className="border border-dashed border-border bg-card/40">
            <EmptyHeader>
              <EmptyTitle>暂无可用冒险者</EmptyTitle>
              <EmptyDescription>请先前往召唤页面铸造至少 3 个冒险者。</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild className="gap-2">
                <Link href="/game/summon">
                  <Sparkles className="size-4" aria-hidden />
                  前往召唤
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Squads</p>
                <h2 className="font-serif text-xl sm:text-2xl">
                  我的队伍{" "}
                  <span className="text-sm text-muted-foreground sm:text-base">
                    ({teams.length}/{MAX_TEAMS_PER_ACCOUNT})
                  </span>
                </h2>
              </div>
              <Button
                onClick={() => setCreating(true)}
                disabled={teams.length >= MAX_TEAMS_PER_ACCOUNT || available.length < 3}
                className="gap-2"
                size="sm"
              >
                <Plus className="size-4" aria-hidden />
                组建新队伍
              </Button>
            </div>

            {teams.length === 0 ? (
              <Empty className="border border-dashed border-border bg-card/40">
                <EmptyHeader>
                  <EmptyTitle>还没有任何队伍</EmptyTitle>
                  <EmptyDescription>
                    选择 3 个不同的角色组建你的第一支深渊小队。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="grid gap-4 lg:grid-cols-2">
                {teams.map((team) => {
                  const members = team.characterIds
                    .map((id) => charById.get(id))
                    .filter(Boolean) as Character[]
                  const power = members.reduce((s, c) => s + c.power, 0)
                  const cooling = team.cooldownUntil > Date.now()
                  const remaining = cooling
                    ? Math.ceil((team.cooldownUntil - Date.now()) / 60_000)
                    : 0

                  return (
                    <li key={team.id}>
                      <Card className="border-border bg-card/60">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-serif text-lg">{team.name}</h3>
                              <p className="font-mono text-xs text-muted-foreground">{team.id}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                总战力
                              </div>
                              <div className="font-mono text-2xl text-primary">{power}</div>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2">
                            {members.map((m) => (
                              <CharacterCard key={m.id} character={m} size="sm" />
                            ))}
                          </div>

                          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                            <div
                              className={`flex items-center gap-2 text-xs sm:text-sm ${
                                cooling ? "text-muted-foreground" : "text-chart-2"
                              }`}
                            >
                              <span
                                className={`size-2 rounded-full ${
                                  cooling ? "bg-muted-foreground" : "bg-chart-2 shadow-[0_0_8px_currentColor]"
                                }`}
                                aria-hidden
                              />
                              {cooling ? `冷却中 · 剩 ${remaining} 分钟` : "待命中"}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                asChild
                                size="sm"
                                disabled={cooling}
                                variant={cooling ? "outline" : "default"}
                                className="gap-1"
                              >
                                <Link href="/game/dungeons">
                                  <Sword className="size-3.5" aria-hidden />
                                  出征
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-destructive hover:text-destructive"
                                onClick={() => disbandTeam(team.id)}
                              >
                                <Trash2 className="size-3.5" aria-hidden />
                                解散
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  )
                })}
              </ul>
            )}

            {/* Roster */}
            <section>
              <div className="mb-3">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Roster</p>
                <h2 className="font-serif text-xl">
                  全部冒险者{" "}
                  <span className="text-sm text-muted-foreground">({characters.length})</span>
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {characters.map((c) => {
                  const used = inUse.has(c.id)
                  return (
                    <div key={c.id} className={used ? "opacity-50" : ""}>
                      <CharacterCard character={c} size="sm" />
                      {used ? (
                        <p className="mt-1 text-center text-[10px] text-muted-foreground">
                          已编入队伍
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Create team dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">组建新队伍</DialogTitle>
            <DialogDescription>选择 3 个不同的角色组成一支深渊小队。</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="team-name">队伍名称 (可选)</FieldLabel>
              <Input
                id="team-name"
                placeholder={`例：深渊小队 #${teams.length + 1}`}
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                maxLength={20}
              />
            </Field>
          </FieldGroup>

          <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-card/60 px-4 py-2">
            <div className="text-sm">
              已选 <span className="font-mono text-primary">{selected.length}</span> / 3
            </div>
            <div className="text-sm">
              预估总战力 <span className="font-mono text-primary">{previewPower}</span>
            </div>
          </div>

          <div className="mt-3 max-h-[55vh] overflow-y-auto pr-1">
            {available.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                没有空闲角色 — 所有角色都已编入其他队伍。
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {available.map((c) => (
                  <CharacterCard
                    key={c.id}
                    character={c}
                    selectable
                    selected={selected.includes(c.id)}
                    disabled={!selected.includes(c.id) && selected.length >= 3}
                    onSelect={() => togglePick(c.id)}
                    size="sm"
                  />
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCreating(false)}>
              取消
            </Button>
            <Button onClick={submit} disabled={selected.length !== 3} className="gap-2">
              <Users className="size-4" aria-hidden />
              确认组队
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 组队仪式动画 */}
      <TeamFormationModal
        open={pactOpen}
        members={selectedChars}
        teamName={teamName}
        onConfirm={sealPact}
        onCancel={cancelPact}
      />
    </>
  )
}

function UnconnectedHint({ onConnect }: { onConnect: () => void }) {
  return (
    <Empty className="border border-dashed border-border bg-card/40">
      <EmptyHeader>
        <EmptyTitle>请先连接钱包</EmptyTitle>
        <EmptyDescription>队伍数据基于你的钱包地址保存。</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onConnect}>连接钱包</Button>
      </EmptyContent>
    </Empty>
  )
}

// Re-export to silence unused-warning if rarity needed
void RARITY_BY_LEVEL
void CLASS_NAMES
