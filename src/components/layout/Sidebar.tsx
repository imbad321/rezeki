"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { NAV_SECTIONS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useClient, type ClientOption } from "@/lib/client-context"
import { ChevronDown, Check, Landmark, Plus } from "lucide-react"
import { useSession } from "next-auth/react"

const CLIENT_HIDDEN_HREFS = new Set(["/import", "/clients", "/investors"])

function ClientBadge({ color, name }: { color: string; name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
  return (
    <span
      className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
    >
      {initials}
    </span>
  )
}

function ClientSelector() {
  const { clients, selected, setSelected, isLoading } = useClient()
  const [open, setOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="px-3 py-3 border-b border-[var(--sidebar-border)]">
        <div className="h-10 rounded-xl bg-white/5 animate-shimmer" />
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="px-3 py-3 border-b border-[var(--sidebar-border)]">
        <Link
          href="/clients"
          className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors text-slate-500 hover:text-slate-300"
        >
          <Plus size={13} />
          <span className="text-xs font-medium">Add your first client</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative px-3 py-3 border-b border-[var(--sidebar-border)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <ClientBadge color={selected.color} name={selected.name} />
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-semibold text-white truncate leading-tight">{selected.name}</div>
          <div className="text-[10px] text-[var(--sidebar-foreground)] truncate mt-0.5">
            {selected.stage} · {selected.industry}
          </div>
        </div>
        <ChevronDown
          size={14}
          className={cn("text-slate-500 shrink-0 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-xl border border-[var(--border-strong)] bg-[#111827] shadow-2xl overflow-hidden animate-scale-in">
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => { setSelected(c); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors"
            >
              <ClientBadge color={c.color} name={c.name} />
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-medium text-white truncate">{c.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{c.stage}</div>
              </div>
              {selected.id === c.id && <Check size={13} className="text-[var(--primary)] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isClient = session?.user?.role === "CLIENT"

  const visibleSections = NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !isClient || !CLIENT_HIDDEN_HREFS.has(item.href)),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <aside className="flex flex-col w-64 min-h-screen shrink-0 border-r border-[var(--sidebar-border)]"
      style={{ background: "var(--sidebar)" }}>

      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--sidebar-border)]">
        <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center shrink-0 glow-green">
          <Landmark size={15} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold tracking-tight text-white leading-tight">Rezeki Holdings</div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)] opacity-80 leading-tight mt-0.5">
            Group
          </div>
        </div>
      </div>

      {/* Portfolio company selector */}
      <div className="px-4 pt-3 pb-1">
        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-600">Portfolio</div>
      </div>
      <ClientSelector />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {visibleSections.map((section) => (
          <div key={section.label}>
            <div className="px-2 mb-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/")
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-fg)]"
                        : "text-[var(--sidebar-foreground)] hover:text-slate-200 hover:bg-white/5"
                    )}
                  >
                    <Icon size={15} className={cn("shrink-0", active && "text-[var(--primary)]")} />
                    {label}
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse-dot" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[var(--sidebar-border)]">
        <div className="text-[10px] text-slate-600 leading-relaxed">
          Rezeki Holdings Group<br />
          <span className="text-slate-700">Portfolio Finance Platform</span>
        </div>
      </div>
    </aside>
  )
}
