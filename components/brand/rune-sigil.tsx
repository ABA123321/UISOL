"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * RuneSigil — 用原图 /rune-sigil.jpg 作为 CSS luminance mask
 *
 * 原理：
 *  - JPG 不能有 alpha 通道，但 CSS `mask-mode: luminance` 会把
 *    像素亮度作为透明度：黑色 → 完全透明，白/金 → 完全显示。
 *  - 这样既保留了 AI 原图的全部细节（24/32 字符文环、星阵、纹饰），
 *    又能拥有真正的透明背景，并且能像 SVG 一样被 backgroundColor 染色。
 *  - 不依赖 mix-blend-mode，因此父容器即使有 backdrop-filter / isolate
 *    也不会被截断成黑底。
 */
type Props = {
  className?: string
  /** 是否缓慢自旋 */
  spin?: boolean
  /** 自旋周期（秒） */
  spinDuration?: number
  /** 整体不透明度 */
  opacity?: number
  /** 主色，默认霓虹金 */
  color?: string
  /** 是否带柔和金色光晕 */
  glow?: boolean
}

export function RuneSigil({
  className,
  spin = false,
  spinDuration = 80,
  opacity = 1,
  color = "oklch(0.84 0.16 80)",
  glow = true,
}: Props) {
  const maskStyle: React.CSSProperties = {
    backgroundColor: color,
    opacity,
    WebkitMaskImage: "url(/rune-sigil.jpg)",
    maskImage: "url(/rune-sigil.jpg)",
    WebkitMaskMode: "luminance",
    maskMode: "luminance",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    filter: glow
      ? "drop-shadow(0 0 14px oklch(0.84 0.16 80 / 0.55)) drop-shadow(0 0 32px oklch(0.84 0.16 80 / 0.25))"
      : undefined,
    animation: spin ? `rune-spin ${spinDuration}s linear infinite` : undefined,
    transformOrigin: "center",
    willChange: spin ? "transform" : undefined,
  }

  return (
    <div className={cn("relative", className)} aria-hidden>
      <div className="absolute inset-0" style={maskStyle} />
    </div>
  )
}
