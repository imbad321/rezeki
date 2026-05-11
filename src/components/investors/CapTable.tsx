"use client"

import { useState } from "react"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { ROUND_LABELS } from "@/lib/constants"
import type { CapTableEntry } from "@/schemas/investor"
import { cn } from "@/lib/utils"

interface Props { entries: CapTableEntry[] }
type SortKey = "ownershipPct" | "investedAmount" | "sharesOwned"

export function CapTable({ entries }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("ownershipPct")
  const sorted = [...entries].sort((a, b) => b[sortKey] - a[sortKey])
  const maxOwnership = Math.max(...entries.map((e) => e.ownershipPct), 1)

  function SortButton({ col, label }: { col: SortKey; label: string }) {
    return (
      <button
        onClick={() => setSortKey(col)}
        className={cn(
          "text-left text-[10px] font-semibold uppercase tracking-widest transition-colors",
          sortKey === col ? "text-[var(--accent-foreground)]" : "text-slate-600 hover:text-slate-400"
        )}
      >
        {label} {sortKey === col ? "↓" : ""}
      </button>
    )
  }

  return (
    <div className="animate-fade-up">
      <div className="text-sm font-semibold text-white mb-3">Cap Table</div>
      <div className="glass overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] px-5 py-3 border-b border-[var(--border)]">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Investor</div>
          <div className="text-right"><SortButton col="ownershipPct"   label="Ownership" /></div>
          <div className="text-right"><SortButton col="investedAmount" label="Invested" /></div>
          <div className="text-right"><SortButton col="sharesOwned"    label="Shares" /></div>
        </div>
        <div>
          {sorted.map((entry, i) => (
            <div
              key={entry.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr] px-5 py-3.5 border-b border-[var(--border)]/40 hover:bg-white/3 transition-colors items-center animate-fade-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="min-w-0 pr-3">
                <div className="text-sm font-medium text-white truncate">{entry.investor.name}</div>
                <div className="text-xs text-slate-500 truncate mt-0.5">
                  {entry.investor.firm && `${entry.investor.firm} · `}
                  {ROUND_LABELS[entry.round.roundType] ?? entry.round.roundType}
                </div>
                <div className="mt-2 h-1 rounded-full bg-white/5 w-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all"
                    style={{ width: `${(entry.ownershipPct / maxOwnership) * 100}%`, opacity: 0.7 + (entry.ownershipPct / maxOwnership) * 0.3 }}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-white tabular">{formatPercent(entry.ownershipPct)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-[var(--positive)] tabular">{formatCurrency(entry.investedAmount, true)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400 tabular">{entry.sharesOwned.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
