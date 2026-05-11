"use client"

import { formatCurrency } from "@/lib/utils"
import { DEPT_LABELS } from "@/lib/constants"
import { VarianceBadge } from "./VarianceBadge"
import type { BudgetRow } from "@/schemas/budget"

interface Props { row: BudgetRow }

export function BudgetTableRow({ row }: Props) {
  const label = DEPT_LABELS[row.department.name] ?? row.department.name

  return (
    <tr className="border-b border-[var(--border)]/50 hover:bg-white/3 transition-colors">
      <td className="sticky left-0 bg-[#111827] py-3.5 px-5 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: row.department.color }} />
          <span className="text-sm font-medium text-white whitespace-nowrap">{label}</span>
        </div>
      </td>
      {row.monthlyData.map((m, i) => {
        const isOver    = m.variance > 0
        const isNeutral = Math.abs(m.variancePct) < 0.5
        return (
          <td key={i} className={`py-3.5 px-3 text-right text-xs ${
            isNeutral ? "" : isOver ? "bg-red-500/5" : "bg-emerald-500/5"
          }`}>
            <div className="font-semibold text-white tabular">{formatCurrency(m.actual, true)}</div>
            <div className="text-slate-600 tabular">{formatCurrency(m.budgeted, true)}</div>
          </td>
        )
      })}
      <td className="py-3.5 px-5 text-right">
        <div className="text-sm font-semibold text-white tabular">{formatCurrency(row.totalActual, true)}</div>
        <VarianceBadge variancePct={row.totalVariancePct} />
      </td>
    </tr>
  )
}
