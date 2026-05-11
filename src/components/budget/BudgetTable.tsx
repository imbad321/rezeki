"use client"

import { BudgetTableRow } from "./BudgetTableRow"
import type { BudgetApiResponse } from "@/schemas/budget"

interface Props {
  data: BudgetApiResponse
}

export function BudgetTable({ data }: Props) {
  const { rows, months } = data

  return (
    <div className="glass overflow-hidden animate-fade-up">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="text-sm font-semibold text-white">Budget vs. Actuals</div>
        <div className="text-xs text-slate-500 mt-0.5">All departments · rolling 6 months</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="sticky left-0 bg-[#111827] py-2.5 px-5 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500 whitespace-nowrap z-10">
                Department
              </th>
              {months.map((m, i) => (
                <th key={i} className="py-2.5 px-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                  {new Date(m).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                </th>
              ))}
              <th className="py-2.5 px-5 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="group">
            {rows.map((row) => (
              <BudgetTableRow key={row.department.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
