"use client"

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface MrrDataPoint {
  month: Date | string
  mrr: number
  newMrr: number
  expansion: number
  churn: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-solid rounded-xl px-4 py-3 text-sm shadow-2xl border border-[var(--border-strong)]">
      <div className="text-slate-500 text-xs mb-2">
        {new Date(label).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
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

export function MrrTrendChart({ data }: { data: MrrDataPoint[] }) {
  const chartData = data.map((d) => ({ month: d.month, MRR: d.mrr, "New MRR": d.newMrr }))
  const id = "mrrGrad"

  return (
    <div className="glass p-5 animate-fade-up delay-300">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-sm font-semibold text-white">MRR Growth</div>
          <div className="text-xs text-slate-500 mt-0.5">Monthly recurring revenue trend</div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] inline-block" />
            MRR
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--positive)] inline-block" />
            New MRR
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="newMrrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#22d3a5" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22d3a5" stopOpacity={0} />
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
            axisLine={false} tickLine={false} width={54}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="MRR"     stroke="#6366f1" strokeWidth={2.5} fill={`url(#${id})`}       dot={false} activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} />
          <Area type="monotone" dataKey="New MRR" stroke="#22d3a5" strokeWidth={1.5} fill="url(#newMrrGrad)" dot={false} activeDot={{ r: 3, fill: "#22d3a5", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
