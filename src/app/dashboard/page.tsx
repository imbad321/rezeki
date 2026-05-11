"use client"

import { useEffect, useState, useCallback } from "react"
import { useClient } from "@/lib/client-context"
import { KpiCard } from "@/components/dashboard/KpiCard"
import { MrrTrendChart } from "@/components/dashboard/MrrTrendChart"
import { BurnCashChart } from "@/components/dashboard/BurnCashChart"
import { PnlChart } from "@/components/dashboard/PnlChart"
import { CategoryDonut } from "@/components/dashboard/CategoryDonut"
import { formatCurrency, formatPercent } from "@/lib/utils"
import {
  TrendingUp, DollarSign, Flame, Clock,
  Wallet, Users, BarChart2, ArrowDownRight,
} from "lucide-react"

interface DashboardData {
  kpis: {
    mrr: number; arr: number; burnRate: number; runway: number
    cashOnHand: number; headcount: number; mrrGrowthPct: number
    grossProfit: number; grossMargin: number
    monthlyRevenue: number; monthlyExpenses: number
    revenueGrowthPct: number; expenseGrowthPct: number
  }
  mrrSeries: any[]
  burnSeries: any[]
  plSeries: any[]
  incomeByCategory: Record<string, number>
  expenseByCategory: Record<string, number>
}

function SkeletonCard() {
  return (
    <div className="glass p-5 space-y-3 animate-fade-up">
      <div className="h-2.5 w-20 rounded bg-white/5 animate-shimmer" />
      <div className="h-7 w-28 rounded bg-white/5 animate-shimmer" />
      <div className="h-2 w-16 rounded bg-white/5 animate-shimmer" />
    </div>
  )
}

export default function DashboardPage() {
  const { selected } = useClient()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/dashboard?clientId=${selected.id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const handler = () => {
      if (!selected) return
      const a = document.createElement("a")
      a.href = `/api/export?clientId=${selected.id}`
      a.download = ""
      a.click()
    }
    document.addEventListener("meridian:export", handler)
    return () => document.removeEventListener("meridian:export", handler)
  }, [selected])

  const runwayMo = data ? Math.floor(data.kpis.runway) : 0

  if (loading || !data) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="glass h-72 animate-fade-up animate-shimmer" />
          <div className="glass h-72 animate-fade-up animate-shimmer" />
        </div>
      </div>
    )
  }

  const { kpis, mrrSeries, burnSeries, plSeries, incomeByCategory, expenseByCategory } = data

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Row 1: Core KPIs ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="MRR" value={formatCurrency(kpis.mrr)} trend={{ pct: kpis.mrrGrowthPct }}
          accent="default" subtitle="vs last month" icon={<TrendingUp size={14} />} delay={0} />
        <KpiCard label="ARR" value={formatCurrency(kpis.arr)}
          accent="gold" subtitle="annualized" icon={<DollarSign size={14} />} delay={50} />
        <KpiCard label="Monthly Burn" value={formatCurrency(kpis.burnRate)}
          accent="negative" subtitle="per month" icon={<Flame size={14} />} delay={100} />
        <KpiCard label="Runway" value={`${runwayMo} mo`}
          accent={runwayMo >= 18 ? "positive" : runwayMo >= 12 ? "neutral" : "negative"}
          subtitle="at current burn" icon={<Clock size={14} />} delay={150} />
      </div>

      {/* ── Row 2: Financial KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Cash on Hand" value={formatCurrency(kpis.cashOnHand)}
          accent="positive" subtitle={`${kpis.headcount} headcount`} icon={<Wallet size={14} />} delay={0} />
        <KpiCard label="Net Profit" value={formatCurrency(kpis.grossProfit)}
          accent={kpis.grossProfit >= 0 ? "positive" : "negative"}
          subtitle="this month" icon={<BarChart2 size={14} />} delay={50} />
        <KpiCard label="Gross Margin" value={`${kpis.grossMargin.toFixed(1)}%`}
          trend={{ pct: kpis.grossMargin }} accent={kpis.grossMargin >= 20 ? "positive" : kpis.grossMargin >= 0 ? "neutral" : "negative"}
          subtitle="net margin" delay={100} />
        <KpiCard label="Expense Growth" value={formatPercent(kpis.expenseGrowthPct)}
          trend={{ pct: kpis.expenseGrowthPct, invertColor: true }}
          accent={kpis.expenseGrowthPct > 15 ? "negative" : "neutral"}
          subtitle="vs last month" icon={<ArrowDownRight size={14} />} delay={150} />
      </div>

      {/* ── Row 3: Charts ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MrrTrendChart data={mrrSeries} />
        <PnlChart data={plSeries} />
      </div>

      {/* ── Row 4: Cash & Donuts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <BurnCashChart data={burnSeries} burnRate={kpis.burnRate} />
        </div>
        <CategoryDonut data={incomeByCategory}  label="Revenue Breakdown"  color="#6366f1" />
        <CategoryDonut data={expenseByCategory} label="Expense Breakdown"  color="#ff5c6a" />
      </div>
    </div>
  )
}
