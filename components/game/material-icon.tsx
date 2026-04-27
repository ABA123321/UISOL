import Image from "next/image"

import { cn } from "@/lib/utils"
import type { MaterialKey } from "@/lib/game-data"

const META: Record<MaterialKey, { tone: string; ring: string; label: string; image: string }> = {
  AE: {
    tone: "text-chart-1",
    ring: "border-chart-1/40",
    label: "远古精华",
    image: "/materials/ae-arcane-essence.jpg",
  },
  BF: {
    tone: "text-chart-5",
    ring: "border-chart-5/40",
    label: "战魂碎片",
    image: "/materials/bf-blood-fragment.jpg",
  },
  MR: {
    tone: "text-chart-2",
    ring: "border-chart-2/40",
    label: "月光符文",
    image: "/materials/mr-moon-rune.jpg",
  },
  ES: {
    tone: "text-chart-4",
    ring: "border-chart-4/40",
    label: "虚空之核",
    image: "/materials/es-eldritch-shard.jpg",
  },
}

interface Props {
  material: MaterialKey
  size?: "sm" | "md" | "lg" | "xl"
  showLabel?: boolean
  className?: string
}

export function MaterialIcon({ material, size = "md", showLabel = false, className }: Props) {
  const meta = META[material]
  const dim =
    size === "sm" ? "size-7" : size === "lg" ? "size-12" : size === "xl" ? "size-20" : "size-9"
  const px = size === "sm" ? 28 : size === "lg" ? 48 : size === "xl" ? 80 : 36

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg border bg-background/40",
          dim,
          meta.ring,
        )}
        aria-hidden
      >
        <Image
          src={meta.image || "/placeholder.svg"}
          alt=""
          width={px}
          height={px}
          className="size-full object-cover"
        />
      </span>
      {showLabel ? (
        <div className="flex flex-col leading-tight">
          <span className="text-xs text-muted-foreground">{material}</span>
          <span className="text-sm font-medium">{meta.label}</span>
        </div>
      ) : null}
    </div>
  )
}

export function getMaterialMeta(key: MaterialKey) {
  return META[key]
}
