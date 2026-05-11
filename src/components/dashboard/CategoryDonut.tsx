"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"

const COLORS = ["#6366f1","#22d3a5","#f59e0b","#ff5c6a","#a78bfa","#22d3ee","#f472b6","#34d399","#fb923c"]

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-solid rounded-xl px-3 py-2 text-xs shadow-2xl border border-[var(--border-strong)]">
      <div className="font-semibold text-white">{payload[0].name}</div>
      <div className="text-slate-400">{formatCurrency(payload[0].value)}</div>
    </div>
  )
}

interface Props {
  data: Record<string, number>
  label: string
  color?: string
}

export function CategoryDonut({ data, label, color }: Props) {
  const entries = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7)

  const total = entries.reduce((s, e) => s + e.value, 0)

  return (
    <div className="glass p-5 animate-fade-up delay-250">
      <div className="text-sm font-semibold text-white mb-1">{label}</div>
      <div className="text-xs text-slate-500 mb-4">by category · {formatCurrency(total)}</div>

      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie data={entries} cx="50%" cy="50%" innerRadius={32} outerRadius={50}
                dataKey="value" strokeWidth={0} paddingAngle={2}>
                {entries.map((_, i) => (
                  <Cell key={i} fill={color ?? COLORS[i % COLORS.length]} opacity={1 - i * 0.08} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1.5 min-w-0">
          {entries.slice(0, 5).map((e, i) => (
            <div key={e.name} className="flex items-center gap-2 text-[11px]">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: color ?? COLORS[i % COLORS.length], opacity: 1 - i * 0.08 }}
              />
              <span className="text-slate-400 truncate flex-1">{e.name}</span>
              <span className="text-slate-300 tabular font-medium shrink-0">
                {((e.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
