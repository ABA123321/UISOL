"use client"

import * as React from "react"
import { Plus, ShoppingCart, Tag, X } from "lucide-react"

import { TopBar } from "@/components/game/top-bar"
import { MaterialIcon, getMaterialMeta } from "@/components/game/material-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGame, type MarketListing } from "@/components/providers/game-provider"
import { MARKET_FEE, MATERIAL_KEYS, type MaterialKey } from "@/lib/game-data"

export default function MarketPage() {
  const {
    connected,
    connect,
    listings,
    inventory,
    listMaterial,
    cancelListing,
    buyListing,
  } = useGame()

  const [filter, setFilter] = React.useState<MaterialKey | "ALL">("ALL")
  const [listOpen, setListOpen] = React.useState(false)
  const [buyTarget, setBuyTarget] = React.useState<MarketListing | null>(null)

  const filtered = React.useMemo(() => {
    if (filter === "ALL") return listings
    return listings.filter((l) => l.material === filter)
  }, [listings, filter])

  return (
    <>
      <TopBar
        title="内盘交易"
        description={`USDT 计价 · 支持部分购买 · ${(MARKET_FEE * 100).toFixed(0)}% 手续费`}
      />

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
          <div className="flex flex-col gap-5">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="-mx-1 flex w-full overflow-x-auto px-1 sm:w-auto">
                <ButtonGroup className="shrink-0">
                  <Button
                    variant={filter === "ALL" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("ALL")}
                  >
                    全部
                  </Button>
                  {MATERIAL_KEYS.map((k) => (
                    <Button
                      key={k}
                      variant={filter === k ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(k)}
                    >
                      {k}
                    </Button>
                  ))}
                </ButtonGroup>
              </div>

              <Button
                onClick={() => setListOpen(true)}
                className="ml-auto gap-2 sm:ml-0"
                size="sm"
              >
                <Plus className="size-4" aria-hidden />
                挂单出售
              </Button>
            </div>

            {/* Listings */}
            {filtered.length === 0 ? (
              <Empty className="border border-dashed border-border bg-card/40">
                <EmptyHeader>
                  <EmptyTitle>暂无符合条件的挂单</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <Card className="border-border bg-card/60">
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {filtered.map((l) => (
                      <li
                        key={l.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6"
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <MaterialIcon material={l.material} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-serif text-base">
                                {getMaterialMeta(l.material).label}
                              </span>
                              <Badge variant="outline" className="font-mono text-[10px]">
                                {l.material}
                              </Badge>
                              {l.isMine ? (
                                <Badge className="text-[10px] bg-primary/20 text-primary border-primary/40">
                                  我的挂单
                                </Badge>
                              ) : null}
                            </div>
                            <p className="font-mono text-xs text-muted-foreground">
                              {l.id} · 卖方 {l.seller}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 sm:gap-6">
                          <Stat label="数量" value={l.amount.toLocaleString()} />
                          <Stat
                            label="单价 USDT"
                            value={l.pricePerUnit.toFixed(4)}
                            highlight
                          />
                          <Stat
                            label="总价"
                            value={(l.pricePerUnit * l.amount).toFixed(2)}
                          />
                        </div>

                        <div className="flex gap-2 sm:ml-auto">
                          {l.isMine ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelListing(l.id)}
                              className="gap-1 text-destructive hover:text-destructive"
                            >
                              <X className="size-3.5" aria-hidden />
                              撤单
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setBuyTarget(l)}
                              className="gap-1"
                            >
                              <ShoppingCart className="size-3.5" aria-hidden />
                              购买
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <p className="text-[11px] text-muted-foreground">
              所有材料只能通过副本掉落产出，市场仅用于二级流通。手续费的 15% 会按推荐关系分给上级
              （直推 10% / 间推 5%）。
            </p>
          </div>
        )}
      </main>

      <ListDialog
        open={listOpen}
        onOpenChange={setListOpen}
        inventory={inventory}
        onSubmit={(material, amount, price) => {
          const ok = listMaterial(material, amount, price)
          if (ok) setListOpen(false)
        }}
      />

      <BuyDialog
        listing={buyTarget}
        onClose={() => setBuyTarget(null)}
        onSubmit={(amount) => {
          if (!buyTarget) return
          const ok = buyListing(buyTarget.id, amount)
          if (ok) setBuyTarget(null)
        }}
      />
    </>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-mono text-sm ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  )
}

function ListDialog({
  open,
  onOpenChange,
  inventory,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  inventory: Record<MaterialKey, number>
  onSubmit: (material: MaterialKey, amount: number, price: number) => void
}) {
  const [material, setMaterial] = React.useState<MaterialKey>("AE")
  const [amount, setAmount] = React.useState(100)
  const [price, setPrice] = React.useState(0.01)

  const max = inventory[material]
  const ok = amount > 0 && amount <= max && price > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">挂单出售</DialogTitle>
          <DialogDescription>
            5% 手续费由买方承担；其中 15% 自动分润给上级推荐人。
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel>材料</FieldLabel>
            <Select value={material} onValueChange={(v) => setMaterial(v as MaterialKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_KEYS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k} — {getMaterialMeta(k).label} （库存 {inventory[k]}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="amt">数量 (最多 {max})</FieldLabel>
            <Input
              id="amt"
              type="number"
              min={1}
              max={max}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="price">单价 (USDT)</FieldLabel>
            <Input
              id="price"
              type="number"
              min={0}
              step={0.0001}
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            />
          </Field>
        </FieldGroup>

        <div className="rounded-lg border border-border bg-background/40 p-3 text-sm">
          <Row label="挂单总价" value={`${(amount * price).toFixed(4)} USDT`} highlight />
          <Row
            label="买方手续费 (5%)"
            value={`${(amount * price * MARKET_FEE).toFixed(4)} USDT`}
            muted
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button disabled={!ok} onClick={() => onSubmit(material, amount, price)} className="gap-2">
            <Tag className="size-4" aria-hidden />
            确认挂单
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BuyDialog({
  listing,
  onClose,
  onSubmit,
}: {
  listing: MarketListing | null
  onClose: () => void
  onSubmit: (amount: number) => void
}) {
  const [amount, setAmount] = React.useState(0)

  React.useEffect(() => {
    if (listing) setAmount(listing.amount)
  }, [listing])

  if (!listing) return null

  const total = amount * listing.pricePerUnit
  const fee = total * MARKET_FEE
  const cost = total + fee
  const ok = amount > 0 && amount <= listing.amount

  return (
    <Dialog open={!!listing} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">购买 {listing.material}</DialogTitle>
          <DialogDescription>
            可部分购买，最多 {listing.amount.toLocaleString()} 单位。
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="buy-amt">购买数量</FieldLabel>
            <Input
              id="buy-amt"
              type="number"
              min={1}
              max={listing.amount}
              value={amount}
              onChange={(e) =>
                setAmount(Math.max(0, Math.min(listing.amount, parseInt(e.target.value) || 0)))
              }
            />
          </Field>
        </FieldGroup>

        <div className="rounded-lg border border-border bg-background/40 p-3 text-sm">
          <Row label="单价" value={`${listing.pricePerUnit.toFixed(4)} USDT`} />
          <Row label="商品金额" value={`${total.toFixed(4)}`} />
          <Row label="手续费 (5%)" value={`${fee.toFixed(4)}`} muted />
          <Row label="支付总额" value={`${cost.toFixed(4)} USDT`} highlight />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button disabled={!ok} onClick={() => onSubmit(amount)} className="gap-2">
            <ShoppingCart className="size-4" aria-hidden />
            确认购买
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
