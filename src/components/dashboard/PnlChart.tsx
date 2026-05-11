"use client"

import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface PlPoint {
  month: Date | string
  income: number
  expenses: number
  profit: number
  margin: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const profit = payload.find((p: any) => p.dataKey === "profit")?.value ?? 0
  return (
    <div className="glass-solid rounded-xl px-4 py-3 text-sm shadow-2xl border border-[var(--border-strong)]">
      <div className="text-slate-500 text-xs mb-2">
        {new Date(label).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
      </div>
      {payload.map((p: any) => p.dataKey !== "margin" && (
        <div key={p.dataKey} className="flex items-center justify-between gap-6">
          <span className="text-slate-500 text-xs capitalize">{p.name}</span>
          <span className="font-semibold tabular" style={{ color: p.color }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
      <div className="mt-1.5 pt-1.5 border-t border-[var(--border)] flex items-center justify-between gap-6">
        <span className="text-slate-500 text-xs">Margin</span>
        <span className={`font-semibold text-xs ${profit >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"}`}>
          {payload.find((p: any) => p.dataKey === "margin")?.value?.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

export function PnlChart({ data }: { data: PlPoint[] }) {
  const chartData = data.map((d) => ({
    month: d.month,
    revenue: d.income,
    expenses: d.expenses,
    profit: d.profit,
    margin: d.margin,
  }))

  return (
    <div className="glass p-5 animate-fade-up delay-200">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-sm font-semibold text-white">P&amp;L Overview</div>
          <div className="text-xs text-slate-500 mt-0.5">Revenue, expenses &amp; net profit</div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--primary)] opacity-70 inline-block" />Revenue</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[var(--negative)] opacity-60 inline-block" />Expenses</span>
          <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dashed border-[var(--gold)] inline-block" />Profit</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#ff5c6a" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#ff5c6a" stopOpacity={0.2} />
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
          <Bar dataKey="revenue"  fill="url(#revGrad)" radius={[3,3,0,0]} maxBarSize={16} name="Revenue" />
          <Bar dataKey="expenses" fill="url(#expGrad)" radius={[3,3,0,0]} maxBarSize={16} name="Expenses" />
          <Line
            type="monotone" dataKey="profit" name="Profit"
            stroke="#d4af37" strokeWidth={2} dot={false}
            activeDot={{ r: 4, fill: "#d4af37", strokeWidth: 0 }}
          />
          <Line type="monotone" dataKey="margin" stroke="transparent" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
