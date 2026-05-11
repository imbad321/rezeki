import { INVESTOR_TYPE_LABELS, ROUND_LABELS } from "@/lib/constants"
import type { Investor } from "@/schemas/investor"

interface Props { investor: Investor }

const TYPE_COLORS: Record<string, string> = {
  LEAD_VC:   "#6366f1",
  VC:        "#22d3ee",
  ANGEL:     "#f59e0b",
  STRATEGIC: "#22d3a5",
}

export function InvestorCard({ investor }: Props) {
  const typeLabel      = INVESTOR_TYPE_LABELS[investor.type] ?? investor.type
  const leadRoundLabel = investor.leadRound ? ROUND_LABELS[investor.leadRound] : null
  const color          = TYPE_COLORS[investor.type] ?? "#64748b"
  const initials       = investor.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="glass p-4 flex items-start gap-3 hover:border-[var(--border-strong)] hover:-translate-y-0.5 transition-all duration-200">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-white"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-white truncate">{investor.name}</div>
        {investor.firm && (
          <div className="text-xs text-slate-500 truncate">{investor.firm}</div>
        )}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}
          >
            {typeLabel}
          </span>
          {leadRoundLabel && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--positive-dim)] text-[var(--positive)]">
              Lead · {leadRoundLabel}
            </span>
          )}
        </div>
        {investor.email && (
          <div className="text-xs text-slate-600 mt-1 truncate">{investor.email}</div>
        )}
      </div>
    </div>
  )
}
