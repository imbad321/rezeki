"use client"

import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/lib/constants"

interface Props {
  selected: DocumentCategory | "ALL"
  onChange: (cat: DocumentCategory | "ALL") => void
  counts: Record<string, number>
}

export function CategoryFilter({ selected, onChange, counts }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {DOCUMENT_CATEGORIES.map((cat) => {
        const count = cat.value === "ALL"
          ? Object.values(counts).reduce((s, n) => s + n, 0)
          : (counts[cat.value] ?? 0)
        const active = selected === cat.value
        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value as DocumentCategory | "ALL")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              active
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat.label}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
