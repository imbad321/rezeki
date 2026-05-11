interface Props {
  variancePct: number
  compact?: boolean
}

export function VarianceBadge({ variancePct, compact = false }: Props) {
  const isOver = variancePct > 0
  const isNeutral = Math.abs(variancePct) < 0.5

  const label = isNeutral
    ? "On budget"
    : `${isOver ? "+" : ""}${variancePct.toFixed(1)}%`

  const cls = isNeutral
    ? "bg-slate-100 text-slate-500"
    : isOver
    ? "bg-red-50 text-red-600"
    : "bg-emerald-50 text-emerald-700"

  return (
    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${compact ? "" : "px-2"} ${cls}`}>
      {label}
    </span>
  )
}
