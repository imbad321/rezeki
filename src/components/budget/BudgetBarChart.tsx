"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { DEPT_LABELS } from "@/lib/constants"
import type { BudgetApiResponse } from "@/schemas/budget"

interface Props {
  data: BudgetApiResponse
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-solid rounded-xl px-4 py-3 text-sm shadow-2xl border border-[var(--border-strong)] space-y-1">
      <div className="text-slate-500 text-xs font-medium mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: p.fill }} />
            {p.name}
          </span>
          <span className="font-semibold text-white text-xs tabular">{formatCurrency(p.value, true)}</span>
        </div>
      ))}
    </div>
  )
}

export function BudgetBarChart({ data }: Props) {
  const chartData = data.months.map((month) => {
    const entry: Record<string, string | number> = {
      month: new Date(month).toLocaleDateString("en-US", { month: "short" }),
    }
    for (const row of data.rows) {
      const label = DEPT_LABELS[row.department.name] ?? row.department.name
      const md = row.monthlyData.find(
        (m) => new Date(m.month).toISOString() === new Date(month).toISOString()
      )
      entry[label] = md?.actual ?? 0
    }
    return entry
  })

  return (
    <div className="glass p-5 animate-fade-up delay-200">
      <div className="mb-5">
        <div className="text-sm font-semibold text-white">Monthly Spend by Department</div>
        <div className="text-xs text-slate-500 mt-0.5">Actuals only · rolling 6 months</div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickFormatter={(v) => formatCurrency(v, true)} axisLine={false} tickLine={false} width={56} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="square"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingTop: "12px", color: "#64748b" }}
          />
          {data.rows.map((row) => (
            <Bar
              key={row.department.id}
              dataKey={DEPT_LABELS[row.department.name] ?? row.department.name}
              stackId="a"
              fill={row.department.color}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
