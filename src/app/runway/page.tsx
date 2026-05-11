"use client"

import { useEffect, useState, useCallback } from "react"
import { useClient } from "@/lib/client-context"
import { formatCurrency } from "@/lib/utils"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { Clock, Flame, Wallet, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface RunwayData {
  kpis: { cashOnHand: number; burnRate: number; runway: number; headcount: number }
}

interface ProjectionPoint {
  month: string
  conservative: number
  base: number
  optimistic: number
}

function buildProjection(cash: number, burn: number, months = 36): ProjectionPoint[] {
  const points: ProjectionPoint[] = []
  const now = new Date()
  for (let i = 0; i <= months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    points.push({
      month: label,
      conservative: Math.max(0, cash - burn * 1.25 * i),
      base: Math.max(0, cash - burn * i),
      optimistic: Math.max(0, cash - burn * 0.75 * i),
    })
    if (points[points.length - 1].conservative === 0 && points[points.length - 1].optimistic === 0) break
  }
  return points
}

function KpiPill({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="glass p-5 flex flex-col gap-2 animate-fade-up">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-bold text-white tabular">{value}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-solid rounded-xl p-3 border border-[var(--border-strong)] shadow-xl text-xs">
      <div className="font-semibold text-white mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className="text-white tabular">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function RunwayPage() {
  const { selected, isLoading: clientLoading } = useClient()
  const [data, setData] = useState<RunwayData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/dashboard?clientId=${selected.id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected])

  useEffect(() => {
    if (!selected) { setData(null); return }
    load()
  }, [selected, load])

  if (clientLoading || loading || (selected && !data)) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass h-28 animate-shimmer" />)}</div>
        <div className="glass h-96 animate-shimmer" />
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="text-slate-500 font-medium mb-1">No portfolio company selected</div>
          <div className="text-slate-600 text-sm">Select a client to view runway projections</div>
        </div>
      </div>
    )
  }

  const { cashOnHand, burnRate, runway, headcount } = data!.kpis
  const burnPerHead = headcount > 0 ? burnRate / headcount : 0
  const projection = buildProjection(cashOnHand, burnRate)

  const baseRunwayMo = Math.floor(runway)
  const conservativeRunwayMo = burnRate > 0 ? Math.floor(cashOnHand / (burnRate * 1.25)) : 999
  const optimisticRunwayMo = burnRate > 0 ? Math.floor(cashOnHand / (burnRate * 0.75)) : 999

  const runwayColor = baseRunwayMo >= 18 ? "#10b981" : baseRunwayMo >= 12 ? "#f59e0b" : "#ff5c6a"

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="animate-slide-up">
        <h1 className="text-xl font-bold text-white tracking-tight">Runway</h1>
        <p className="text-sm text-slate-500 mt-0.5">Cash runway projections at different burn scenarios</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiPill label="Cash on Hand" value={formatCurrency(cashOnHand)} icon={<Wallet size={13} />} accent="#10b981" />
        <KpiPill label="Monthly Burn" value={formatCurrency(burnRate)} icon={<Flame size={13} />} accent="#ff5c6a" />
        <KpiPill label="Base Runway" value={`${baseRunwayMo} mo`} icon={<Clock size={13} />} accent={runwayColor} />
        <KpiPill label="Burn / Head" value={formatCurrency(burnPerHead)} icon={<TrendingDown size={13} />} accent="#a78bfa" />
      </div>

      {/* Scenario cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Conservative", subtitle: "+25% burn", months: conservativeRunwayMo, color: "#ff5c6a", bg: "var(--negative-dim)" },
          { label: "Base Case", subtitle: "current burn", months: baseRunwayMo, color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
          { label: "Optimistic", subtitle: "−25% burn", months: optimisticRunwayMo, color: "#10b981", bg: "var(--positive-dim)" },
        ].map((s) => (
          <div key={s.label} className="glass p-5 animate-fade-up" style={{ borderColor: `${s.color}30`, background: s.bg }}>
            <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: s.color }}>{s.label}</div>
            <div className="text-3xl font-bold text-white tabular">{s.months >= 999 ? "∞" : s.months}<span className="text-sm font-normal text-slate-400 ml-1">mo</span></div>
            <div className="text-xs text-slate-500 mt-1">{s.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Projection chart */}
      <div className="glass p-5 animate-fade-up delay-100">
        <div className="mb-4">
          <div className="text-sm font-semibold text-white">Cash Balance Projection</div>
          <div className="text-xs text-slate-500 mt-0.5">36-month forecast across burn scenarios</div>
        </div>
        <div className="flex items-center gap-5 mb-4">
          {[
            { label: "Optimistic (−25%)", color: "#10b981" },
            { label: "Base Case", color: "#6366f1" },
            { label: "Conservative (+25%)", color: "#ff5c6a" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded" style={{ background: l.color }} />
              <span className="text-[11px] text-slate-500">{l.label}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={projection} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              {[
                { id: "opt", color: "#10b981" },
                { id: "base", color: "#6366f1" },
                { id: "cons", color: "#ff5c6a" },
              ].map((g) => (
                <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={g.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} interval={5} />
            <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={55} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,92,106,0.3)" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="optimistic" name="Optimistic" stroke="#10b981" strokeWidth={2} fill="url(#opt)" dot={false} />
            <Area type="monotone" dataKey="base" name="Base" stroke="#6366f1" strokeWidth={2} fill="url(#base)" dot={false} />
            <Area type="monotone" dataKey="conservative" name="Conservative" stroke="#ff5c6a" strokeWidth={2} fill="url(#cons)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Burn table */}
      <div className="glass overflow-hidden animate-fade-up delay-150">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <div className="text-sm font-semibold text-white">Monthly Cash Balance</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Month", "Conservative", "Base Case", "Optimistic"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projection.filter((_, i) => i % 3 === 0).slice(0, 13).map((row) => (
                <tr key={row.month} className="border-b border-[var(--border)]/40 hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-slate-400 text-xs">{row.month}</td>
                  <td className={cn("px-5 py-3 tabular font-medium text-xs", row.conservative === 0 ? "text-slate-600" : "text-[var(--negative)]")}>{row.conservative === 0 ? "—" : formatCurrency(row.conservative)}</td>
                  <td className={cn("px-5 py-3 tabular font-medium text-xs", row.base === 0 ? "text-slate-600" : "text-[var(--primary)]")}>{row.base === 0 ? "—" : formatCurrency(row.base)}</td>
                  <td className={cn("px-5 py-3 tabular font-medium text-xs", row.optimistic === 0 ? "text-slate-600" : "text-[var(--positive)]")}>{row.optimistic === 0 ? "—" : formatCurrency(row.optimistic)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
