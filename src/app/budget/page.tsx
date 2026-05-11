"use client"

import { useEffect, useState, useCallback } from "react"
import { useClient } from "@/lib/client-context"
import { useSession } from "next-auth/react"
import { BudgetTable } from "@/components/budget/BudgetTable"
import { BudgetBarChart } from "@/components/budget/BudgetBarChart"
import { DEPT_LABELS, DEPT_COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react"

const DEPT_OPTIONS = Object.keys(DEPT_LABELS) as (keyof typeof DEPT_LABELS)[]

function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [y, m] = value.split("-").map(Number)
  function shift(delta: number) {
    const d = new Date(y, m - 1 + delta, 1)
    onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => shift(-1)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
        <ChevronLeft size={14} />
      </button>
      <span className="text-sm font-semibold text-white w-28 text-center">
        {new Date(y, m - 1, 1).toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
      </span>
      <button onClick={() => shift(1)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

function AddEntryModal({
  open,
  clientId,
  onClose,
  onSaved,
}: {
  open: boolean
  clientId: string | undefined
  onClose: () => void
  onSaved: () => void
}) {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [dept, setDept] = useState(DEPT_OPTIONS[0])
  const [month, setMonth] = useState(defaultMonth)
  const [budgeted, setBudgeted] = useState("")
  const [actual, setActual] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) { setDept(DEPT_OPTIONS[0]); setMonth(defaultMonth); setBudgeted(""); setActual(""); setError("") }
  }, [open])

  if (!open) return null

  async function handleSave() {
    if (!clientId) return
    if (!budgeted) { setError("Budgeted amount is required"); return }
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          departmentName: dept,
          month,
          budgeted: parseFloat(budgeted) || 0,
          actual: parseFloat(actual) || 0,
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to save"); return }
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="glass-solid rounded-2xl p-6 shadow-2xl border border-[var(--border-strong)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white">Add Budget Entry</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Department
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DEPT_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDept(d)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                      dept === d
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 text-white"
                        : "border-[var(--border)] text-slate-400 hover:text-white hover:border-white/20"
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: DEPT_COLORS[d] ?? "#6366f1" }}
                    />
                    {DEPT_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Month
              </label>
              <MonthPicker value={month} onChange={setMonth} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                  Budgeted *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={budgeted}
                    onChange={(e) => setBudgeted(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-colors tabular"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                  Actual
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={actual}
                    onChange={(e) => setActual(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-colors tabular"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-[var(--negative)]">{error}</p>}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!budgeted || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {saving ? "Saving…" : "Add Entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BudgetPage() {
  const { selected, isLoading: clientLoading } = useClient()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const load = useCallback(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/budget?clientId=${selected.id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected])

  useEffect(() => {
    if (!selected) { setData(null); return }
    load()
  }, [selected, load])

  if (clientLoading || loading || (selected && !data)) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="glass h-72 animate-shimmer" />
        <div className="glass h-56 animate-shimmer" />
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="text-slate-500 font-medium mb-1">No portfolio company selected</div>
          <div className="text-slate-600 text-sm">Add a client from the Clients page to get started</div>
        </div>
      </div>
    )
  }

  if (!data?.rows?.length) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Budget</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track department budgets vs actuals</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus size={15} />
              Add Entry
            </button>
          )}
        </div>
        <div className="glass flex flex-col items-center justify-center py-24 gap-4 animate-scale-in">
          <div className="text-slate-500 font-medium">No budget data yet</div>
          <div className="text-slate-600 text-sm">Use "Add Entry" to start tracking department budgets</div>
        </div>
        <AddEntryModal open={addOpen} clientId={selected?.id} onClose={() => setAddOpen(false)} onSaved={load} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Budget</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track department budgets vs actuals</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            Add Entry
          </button>
        )}
      </div>

      <BudgetTable data={data} />
      <BudgetBarChart data={data} />

      <AddEntryModal
        open={addOpen}
        clientId={selected?.id}
        onClose={() => setAddOpen(false)}
        onSaved={load}
      />
    </div>
  )
}
