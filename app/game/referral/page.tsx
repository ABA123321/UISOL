"use client"

import * as React from "react"
import { toast } from "sonner"
import { ArrowDownRight, Copy, Link2, ScrollText, ShieldCheck, Users } from "lucide-react"

import { TopBar } from "@/components/game/top-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useGame } from "@/components/providers/game-provider"
import { REFERRAL_DIRECT, REFERRAL_INDIRECT } from "@/lib/game-data"

export default function ReferralPage() {
  const { connected, connect, referrer, myReferralCode, bindReferrer } = useGame()
  const [code, setCode] = React.useState("")

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${myReferralCode}`
      : `https://runeas.xyz/?ref=${myReferralCode}`

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} 已复制`)
    } catch {
      toast.error("复制失败")
    }
  }

  return (
    <>
      <TopBar
        title="推荐人系统"
        description={`直推 ${(REFERRAL_DIRECT * 100).toFixed(0)}% · 间推 ${(REFERRAL_INDIRECT * 100).toFixed(0)}% · 自助绑定`}
      />

      <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
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
          <div className="grid gap-5 lg:grid-cols-3">
            {/* My code */}
            <Card className="border-border bg-card/60 lg:col-span-2">
              <CardContent className="p-4 sm:p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">My Code</p>
                <h2 className="font-serif text-lg sm:text-xl">分享你的专属链接</h2>

                <div className="mt-4 flex flex-col gap-3">
                  {/* 推荐码 */}
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 sm:px-4 sm:py-3">
                    <ScrollText className="size-4 shrink-0 text-primary" aria-hidden />
                    <span className="flex-1 truncate font-mono text-base text-primary sm:text-lg">
                      {myReferralCode}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 sm:size-auto sm:px-3"
                      onClick={() => copy(myReferralCode, "推荐码")}
                      aria-label="复制推荐码"
                    >
                      <Copy className="size-3.5" aria-hidden />
                      <span className="hidden sm:ml-1 sm:inline">复制</span>
                    </Button>
                  </div>

                  {/* 邀请链接 — mobile 显示缩短版，复制时仍复制完整链接 */}
                  <div className="rounded-lg border border-border bg-background/40 px-3 py-2.5 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2">
                      <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      {/* 手机端只显示尾部关键信息 */}
                      <span
                        className="min-w-0 flex-1 truncate font-mono text-xs text-foreground/80 sm:hidden"
                        title={referralLink}
                      >
                        …/?ref={myReferralCode}
                      </span>
                      {/* 平板及以上显示完整链接 */}
                      <span
                        className="hidden min-w-0 flex-1 truncate font-mono text-sm sm:inline-block"
                        title={referralLink}
                      >
                        {referralLink}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 sm:size-auto sm:px-3"
                        onClick={() => copy(referralLink, "邀请链接")}
                        aria-label="复制完整邀请链接"
                      >
                        <Copy className="size-3.5" aria-hidden />
                        <span className="hidden sm:ml-1 sm:inline">复制</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Stat
                    label="直推 / Lv.1"
                    value={`${(REFERRAL_DIRECT * 100).toFixed(0)}%`}
                    hint="体力购买 + 内盘手续费"
                  />
                  <Stat
                    label="间推 / Lv.2"
                    value={`${(REFERRAL_INDIRECT * 100).toFixed(0)}%`}
                    hint="二级推荐自动分润"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bind referrer */}
            <Card className="border-border bg-card/60">
              <CardContent className="p-4 sm:p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  My Referrer
                </p>
                <h2 className="font-serif text-lg sm:text-xl">绑定我的推荐人</h2>

                {referrer ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 rounded-lg border border-chart-2/40 bg-chart-2/10 px-3 py-2.5 text-chart-2 sm:px-4 sm:py-3">
                      <ShieldCheck className="size-4 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate font-mono text-xs sm:text-sm">
                        {referrer}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      推荐关系一旦绑定，无法修改。
                    </p>
                  </div>
                ) : (
                  <FieldGroup className="mt-4">
                    <Field>
                      <FieldLabel htmlFor="ref-code">推荐人钱包地址</FieldLabel>
                      <Input
                        id="ref-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="例如 0xabc...123"
                      />
                    </Field>
                    <Button
                      onClick={() => {
                        const ok = bindReferrer(code)
                        if (ok) setCode("")
                      }}
                      disabled={!code.trim()}
                      className="gap-2"
                    >
                      <ShieldCheck className="size-4" aria-hidden />
                      自助绑定
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      未绑定推荐人时，分润归项目方奖金池。
                    </p>
                  </FieldGroup>
                )}
              </CardContent>
            </Card>

            {/* Stats summary */}
            <Card className="border-border bg-card/60 lg:col-span-3">
              <CardContent className="p-4 sm:p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Referral Stats
                </p>
                <h2 className="font-serif text-lg sm:text-xl">分润统计（演示数据）</h2>

                <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <SummaryStat icon={Users} label="一级伙伴" value="12" />
                  <SummaryStat icon={Users} label="二级伙伴" value="34" />
                  <SummaryStat icon={ArrowDownRight} label="累计直推分润" value="48.27 USDT" tone="primary" />
                  <SummaryStat icon={ArrowDownRight} label="累计间推分润" value="11.93 USDT" tone="accent" />
                </ul>

                <div className="mt-6 rounded-lg border border-border bg-background/40 p-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  <p>
                    系统采用<strong className="text-foreground"> 自助式两级分销</strong>。每当你的下级在
                    <strong className="text-foreground"> 购买体力 </strong>或在
                    <strong className="text-foreground"> 内盘交易（手续费部分） </strong>
                    产生消费时，
                    <span className="text-primary"> 直推 10% </span>+
                    <span className="text-accent"> 间推 5% </span>
                    会以 USDT 形式自动结算到对应钱包。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3 sm:p-4">
      <div className="text-[11px] text-muted-foreground sm:text-xs">{label}</div>
      <div className="mt-1 font-serif text-xl text-primary sm:text-2xl">{value}</div>
      {hint ? (
        <div className="mt-1 text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
          {hint}
        </div>
      ) : null}
    </div>
  )
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users
  label: string
  value: string
  tone?: "primary" | "accent"
}) {
  const color = tone === "primary" ? "text-primary" : tone === "accent" ? "text-accent" : "text-foreground"
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3 sm:p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card/60 sm:size-10">
        <Icon className={`size-4 ${color}`} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] text-muted-foreground sm:text-xs">{label}</div>
        <div className={`truncate font-serif text-base sm:text-xl ${color}`}>{value}</div>
      </div>
    </li>
  )
}
