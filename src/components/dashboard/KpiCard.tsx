"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface KpiCardProps {
  label: string
  value: string
  trend?: { pct: number; invertColor?: boolean }
  accent?: "default" | "positive" | "negative" | "neutral" | "gold"
  subtitle?: string
  icon?: ReactNode
  delay?: number
}

const ACCENT_STYLES = {
  default:  { value: "text-white",             dim: "rgba(255,255,255,0.06)",   border: "rgba(255,255,255,0.08)",  glow: "" },
  positive: { value: "text-[var(--positive)]",  dim: "var(--positive-dim)",      border: "rgba(34,211,165,0.2)",   glow: "glow-green" },
  negative: { value: "text-[var(--negative)]",  dim: "var(--negative-dim)",      border: "rgba(255,92,106,0.2)",   glow: "glow-red" },
  neutral:  { value: "text-slate-400",          dim: "rgba(100,116,139,0.08)",   border: "rgba(100,116,139,0.15)", glow: "" },
  gold:     { value: "gold-text",               dim: "var(--gold-dim)",          border: "rgba(212,175,55,0.2)",   glow: "glow-gold" },
}

export function KpiCard({ label, value, trend, accent = "default", subtitle, icon, delay = 0 }: KpiCardProps) {
  const s = ACCENT_STYLES[accent]
  const trendPositive = (trend?.pct ?? 0) >= 0
  const trendGood = trend?.invertColor ? !trendPositive : trendPositive

  return (
    <div
      className={cn(
        "glass p-5 flex flex-col gap-3 animate-fade-up cursor-default",
        "hover:border-[var(--border-strong)] transition-all duration-300 hover:-translate-y-0.5",
        s.glow
      )}
      style={{
        background: `linear-gradient(135deg, ${s.dim} 0%, rgba(255,255,255,0.015) 100%)`,
        borderColor: s.border,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
        {icon && <div className="text-slate-600">{icon}</div>}
      </div>

      <div className={cn("text-2xl font-bold tabular tracking-tight leading-none", s.value)}>
        {value}
      </div>

      <div className="flex items-center gap-2 mt-auto">
        {trend && (
          <span className={cn(
            "flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
            trendGood
              ? "text-[var(--positive)] bg-[var(--positive-dim)]"
              : "text-[var(--negative)] bg-[var(--negative-dim)]"
          )}>
            {trendPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend.pct).toFixed(1)}%
          </span>
        )}
        {subtitle && <span className="text-[11px] text-slate-600">{subtitle}</span>}
      </div>
    </div>
  )
}
