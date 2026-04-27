"use client"

import { LogOut } from "lucide-react"

import { useGame } from "@/components/providers/game-provider"
import { RuneAbyssLogo } from "@/components/brand/rune-abyss-logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function WalletButton({ size = "default" }: { size?: "default" | "sm" | "lg" }) {
  const {
    connected,
    address,
    shortAddress,
    chainId,
    walletKind,
    isRealWallet,
    connect,
    disconnect,
    advent,
    usdt,
  } = useGame()

  if (!connected) {
    return (
      <Button
        onClick={connect}
        size={size}
        className="gap-2 px-3 font-medium sm:px-4"
      >
        <RuneAbyssLogo size={16} title={null} />
        <span className="hidden sm:inline">连接钱包</span>
        <span className="sm:hidden">连接</span>
      </Button>
    )
  }

  // 极简移动端展示（0xabcd…ef12 进一步压缩）
  const compact = address ? `${address.slice(0, 4)}…${address.slice(-3)}` : ""
  const onBsc = chainId === 56
  const dotColor = onBsc ? "bg-accent" : "bg-chart-5"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className="gap-2 px-2.5 font-mono text-xs sm:gap-3 sm:px-4 sm:text-sm"
          aria-label={`钱包 ${address}`}
        >
          <span
            className={`size-2 rounded-full ${dotColor} shadow-[0_0_8px_currentColor]`}
            aria-hidden
          />
          <span className="sm:hidden">{compact}</span>
          <span className="hidden sm:inline">{shortAddress ?? address}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between gap-2 font-serif">
          <span>钱包</span>
          <span
            className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] ${
              isRealWallet
                ? "border-chart-2/40 bg-chart-2/10 text-chart-2"
                : "border-chart-5/40 bg-chart-5/10 text-chart-5"
            }`}
          >
            {isRealWallet ? "Live" : "Demo"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem disabled className="flex justify-between">
          <span className="text-muted-foreground">钱包</span>
          <span className="font-mono text-foreground">{walletKind ?? "—"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="flex justify-between">
          <span className="text-muted-foreground">网络</span>
          <span
            className={`font-mono ${onBsc ? "text-chart-2" : "text-chart-5"}`}
          >
            {chainId ? `Chain ${chainId}${onBsc ? " · BSC" : ""}` : "—"}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="flex justify-between gap-3">
          <span className="text-muted-foreground">地址</span>
          <span className="truncate font-mono text-foreground">{shortAddress ?? address}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled className="flex justify-between">
          <span className="text-muted-foreground">$ADVENT</span>
          <span className="font-mono text-foreground">{advent.toLocaleString()}</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="flex justify-between">
          <span className="text-muted-foreground">USDT</span>
          <span className="font-mono text-foreground">{usdt.toFixed(2)}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={disconnect}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" aria-hidden />
          断开连接
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
