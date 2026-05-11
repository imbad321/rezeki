"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useClient } from "@/lib/client-context"
import { NAV_ITEMS } from "@/lib/constants"
import { Search, ArrowRight, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Item {
  id: string
  label: string
  sub?: string
  icon?: React.ReactNode
  action: () => void
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [cursor, setCursor] = useState(0)
  const router = useRouter()
  const { clients, setSelected } = useClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((v) => !v) }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (open) { setQuery(""); setCursor(0); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  const navItems: Item[] = NAV_ITEMS.map((n) => ({
    id: `nav-${n.href}`,
    label: n.label,
    sub: n.href,
    icon: <n.icon size={14} className="text-[var(--primary)]" />,
    action: () => { router.push(n.href); setOpen(false) },
  }))

  const clientItems: Item[] = clients.map((c) => ({
    id: `client-${c.id}`,
    label: c.name,
    sub: `Switch to ${c.stage ?? "company"}`,
    icon: (
      <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white" style={{ background: c.color }}>
        {c.name[0].toUpperCase()}
      </span>
    ),
    action: () => { setSelected(c); setOpen(false) },
  }))

  const allItems = [...navItems, ...clientItems]

  const filtered = query
    ? allItems.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()) || i.sub?.toLowerCase().includes(query.toLowerCase()))
    : allItems

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, filtered.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
    else if (e.key === "Enter" && filtered[cursor]) { filtered[cursor].action() }
  }

  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement
    el?.scrollIntoView({ block: "nearest" })
  }, [cursor])

  useEffect(() => { setCursor(0) }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 animate-fade-in" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className="relative w-full max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="glass-solid rounded-2xl border border-[var(--border-strong)] shadow-2xl overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
            <Search size={15} className="text-slate-500 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, switch portfolio…"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none"
            />
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)] text-slate-600">Esc</kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-72 overflow-y-auto py-1.5">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-600">No results</div>
            )}

            {!query && clientItems.length > 0 && (
              <div className="px-3 pt-1 pb-0.5">
                <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 px-2 py-1">Portfolio</div>
              </div>
            )}

            {filtered.map((item, i) => {
              const isNavItem = item.id.startsWith("nav-")
              const showSection = !query && i === navItems.length && clientItems.length > 0
              return (
                <div key={item.id}>
                  {showSection && (
                    <div className="px-3 pt-1 pb-0.5">
                      <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 px-2 py-1">Switch Portfolio</div>
                    </div>
                  )}
                  <button
                    onClick={item.action}
                    onMouseEnter={() => setCursor(i)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                      cursor === i ? "bg-white/8 text-white" : "text-slate-400 hover:text-white"
                    )}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0 text-left">
                      <div className={cn("font-medium truncate", cursor === i ? "text-white" : "text-slate-300")}>{item.label}</div>
                      {item.sub && <div className="text-[11px] text-slate-600 truncate">{item.sub}</div>}
                    </div>
                    {cursor === i && <ArrowRight size={13} className="text-[var(--primary)] shrink-0" />}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="px-4 py-2 border-t border-[var(--border)] flex items-center gap-3 text-[10px] text-slate-700">
            <span><kbd className="font-mono">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono">↵</kbd> select</span>
            <span><kbd className="font-mono">Esc</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
