"use client"

import { usePathname } from "next/navigation"
import { NAV_ITEMS } from "@/lib/constants"
import { useClient } from "@/lib/client-context"
import { Download } from "lucide-react"
import { cn } from "@/lib/utils"

const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.map(({ href, label }) => [href, label])
)

export function TopBar() {
  const pathname = usePathname()
  const { selected } = useClient()

  const title =
    Object.entries(PAGE_TITLES).find(([href]) =>
      pathname === href || pathname.startsWith(href + "/")
    )?.[1] ?? "Meridian"

  const showExport = pathname === "/dashboard" || pathname === "/transactions"

  return (
    <header className={cn(
      "h-14 flex items-center px-6 shrink-0 border-b border-[var(--border)]",
      "bg-[var(--surface)]"
    )}>
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-white">{title}</h1>
        {selected && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: `${selected.color}20`,
              color: selected.color,
              border: `1px solid ${selected.color}40`,
            }}
          >
            {selected.name}
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {showExport && (
          <button
            id="topbar-export-btn"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
              "bg-[var(--gold-dim)] text-[var(--gold-bright)] border border-[var(--gold)]",
              "hover:bg-[var(--gold)] hover:text-black transition-all duration-200"
            )}
            onClick={() => {
              document.dispatchEvent(new CustomEvent("meridian:export"))
            }}
          >
            <Download size={12} />
            Export Excel
          </button>
        )}
        <span className="text-[10px] text-slate-600 font-medium hidden sm:block">FY 2025–26</span>
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold",
          "bg-[var(--accent)] text-[var(--accent-foreground)]"
        )}>
          CFO
        </div>
      </div>
    </header>
  )
}
