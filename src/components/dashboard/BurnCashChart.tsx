"use client"

import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface BurnSeriesPoint {
  month: Date | string
  burn: number
  cash: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-solid rounded-xl px-4 py-3 text-sm shadow-2xl border border-[var(--border-strong)]">
      <div className="text-slate-500 text-xs mb-2">
        {new Date(label).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
      </div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-6">
          <span className="text-slate-500 text-xs">{p.name}</span>
          <span className="font-semibold tabular" style={{ color: p.color }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function BurnCashChart({ data, burnRate }: { data: BurnSeriesPoint[]; burnRate: number }) {
  const chartData = data.map((d) => ({
    month: d.month,
    "Cash Balance": d.cash,
    "Monthly Burn": burnRate,
  }))

  return (
    <div className="glass p-5 animate-fade-up delay-400">
      <div className="mb-5">
        <div className="text-sm font-semibold text-white">Cash & Burn</div>
        <div className="text-xs text-slate-500 mt-0.5">Runway projection</div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cashGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#22d3a5" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22d3a5" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="burnGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#ff5c6a" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#ff5c6a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "#475569" }}
            tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short" })}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#475569" }}
            tickFormatter={(v) => formatCurrency(v, true)}
            axisLine={false} tickLine={false} width={58}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="Cash Balance" stroke="#22d3a5" strokeWidth={2.5} fill="url(#cashGrad2)" dot={false} activeDot={{ r: 4, fill: "#22d3a5", strokeWidth: 0 }} />
          <Area type="monotone" dataKey="Monthly Burn"  stroke="#ff5c6a" strokeWidth={1.5} fill="url(#burnGrad2)" strokeDasharray="5 4" dot={false} activeDot={{ r: 3, fill: "#ff5c6a", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
