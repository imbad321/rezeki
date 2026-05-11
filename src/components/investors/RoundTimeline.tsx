"use client"

import { formatCurrency } from "@/lib/utils"
import { ROUND_LABELS } from "@/lib/constants"
import type { FundingRound } from "@/schemas/investor"

interface Props { rounds: FundingRound[] }

export function RoundTimeline({ rounds }: Props) {
  return (
    <div>
      <div className="text-sm font-semibold text-white mb-4">Funding Timeline</div>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-white/5" />
        <div className="space-y-4">
          {rounds.map((round, i) => (
            <div key={round.id} className="relative flex items-start gap-4 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border ${
                i === rounds.length - 1
                  ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                  : "bg-[var(--elevated)] border-[var(--border-strong)] text-slate-400"
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 glass p-4 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="font-semibold text-sm text-white">
                    {ROUND_LABELS[round.roundType] ?? round.roundType}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(round.closedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {[
                    ["Raised",     formatCurrency(round.amountRaised, true)],
                    ["Pre-Money",  formatCurrency(round.preMoneyVal, true)],
                    ["Post-Money", formatCurrency(round.postMoneyVal, true)],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest">{label}</div>
                      <div className="text-sm font-semibold text-white tabular mt-0.5">{val}</div>
                    </div>
                  ))}
                </div>
                {round.leadInvestor && (
                  <div className="mt-2 text-xs text-slate-500">
                    Lead: <span className="text-slate-300 font-medium">{round.leadInvestor}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
