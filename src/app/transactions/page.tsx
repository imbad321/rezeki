"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useClient } from "@/lib/client-context"
import { useSession } from "next-auth/react"
import { formatCurrency } from "@/lib/utils"
import { TRANSACTION_CATEGORIES } from "@/lib/constants"
import {
  ArrowUpRight, ArrowDownRight, Search, Plus, Trash2,
  ChevronUp, ChevronDown, ChevronsUpDown, X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string; date: string; description: string
  category: string; type: string; amount: number
}

const TYPE_FILTERS = ["All", "Income", "Expenses"] as const
type TypeFilter = (typeof TYPE_FILTERS)[number]
type SortKey = "date" | "amount" | "category" | "description"
type SortDir = "asc" | "desc"

const CATEGORY_COLORS: Record<string, string> = {
  "SaaS Subscriptions": "#6366f1", "Professional Services": "#a78bfa",
  "API Usage": "#22d3ee", "Enterprise Licenses": "#f59e0b",
  "Platform Revenue": "#34d399", "Marketplace": "#22d3a5",
  "Payroll": "#ff5c6a", "Infrastructure": "#fb923c",
  "Sales & Marketing": "#f472b6", "R&D Tools": "#60a5fa",
  "Office & Admin": "#94a3b8", "Legal & Compliance": "#fbbf24",
}

function SummaryCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className={cn("glass p-4 flex flex-col gap-2 animate-fade-up", positive === true && "glow-green", positive === false && "glow-red")}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className={cn("text-xl font-bold tabular", positive === true ? "text-[var(--positive)]" : positive === false ? "text-[var(--negative)]" : "text-white")}>{value}</div>
      {sub && <div className="text-[11px] text-slate-600">{sub}</div>}
    </div>
  )
}

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={11} className="text-slate-700" />
  return dir === "asc" ? <ChevronUp size={11} className="text-[var(--primary)]" /> : <ChevronDown size={11} className="text-[var(--primary)]" />
}

function AddTransactionModal({ open, clientId, onClose, onSaved }: { open: boolean; clientId?: string; onClose: () => void; onSaved: () => void }) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

  const [date, setDate] = useState(today)
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState(TRANSACTION_CATEGORIES[0] as string)
  const [type, setType] = useState<"INCOME" | "EXPENSE">("INCOME")
  const [amount, setAmount] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) { setDate(today); setDescription(""); setCategory(TRANSACTION_CATEGORIES[0]); setType("INCOME"); setAmount(""); setError("") }
  }, [open])

  if (!open) return null

  async function handleSave() {
    if (!clientId || !description || !amount) { setError("All fields are required"); return }
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, date, description, category, type, amount: parseFloat(amount) }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return }
      onSaved(); onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="glass-solid rounded-2xl p-6 shadow-2xl border border-[var(--border-strong)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-white">Add Transaction</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"><X size={15} /></button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 p-1 rounded-lg bg-white/5">
              {(["INCOME", "EXPENSE"] as const).map((t) => (
                <button key={t} onClick={() => setType(t)} className={cn("flex-1 py-2 rounded-md text-xs font-semibold transition-all", type === t ? (t === "INCOME" ? "bg-[var(--positive)] text-black" : "bg-[var(--negative)] text-white") : "text-slate-400 hover:text-white")}>
                  {t === "INCOME" ? "Income" : "Expense"}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-colors" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Stripe revenue" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[var(--primary)] transition-colors" />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-[#111827] border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-colors">
                {TRANSACTION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                <input type="number" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-colors tabular" />
              </div>
            </div>

            {error && <p className="text-xs text-[var(--negative)]">{error}</p>}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={!description || !amount || saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-40 transition-all">
              {saving ? "Saving…" : "Add Transaction"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  const { selected, isLoading: clientLoading } = useClient()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [addOpen, setAddOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/transactions?clientId=${selected.id}`)
      .then((r) => r.json())
      .then((txs) => { setTransactions(txs); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected])

  useEffect(() => {
    if (!selected) { setTransactions([]); return }
    load()
  }, [selected, load])

  useEffect(() => {
    const handler = () => {
      if (!selected) return
      const a = document.createElement("a"); a.href = `/api/export?clientId=${selected.id}`; a.download = ""; a.click()
    }
    document.addEventListener("meridian:export", handler)
    return () => document.removeEventListener("meridian:export", handler)
  }, [selected])

  async function handleDelete(id: string) {
    setDeletingId(id)
    await fetch(`/api/transactions/${id}`, { method: "DELETE" })
    setTransactions((prev) => prev.filter((t) => t.id !== id))
    setDeletingId(null)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir("desc") }
  }

  const categories = useMemo(() => ["All", ...Array.from(new Set(transactions.map((t) => t.category)))], [transactions])

  const filtered = useMemo(() => {
    const rows = transactions.filter((tx) => {
      const matchType = typeFilter === "All" ? true : typeFilter === "Income" ? tx.type === "INCOME" : tx.type === "EXPENSE"
      const matchCat = categoryFilter === "All" || tx.category === categoryFilter
      const q = search.toLowerCase()
      const matchSearch = !q || tx.description.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q)
      return matchType && matchCat && matchSearch
    })
    return [...rows].sort((a, b) => {
      let cmp = 0
      if (sortKey === "date") cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
      else if (sortKey === "amount") cmp = a.amount - b.amount
      else if (sortKey === "category") cmp = a.category.localeCompare(b.category)
      else if (sortKey === "description") cmp = a.description.localeCompare(b.description)
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [transactions, typeFilter, categoryFilter, search, sortKey, sortDir])

  const totalIncome = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0)
  const netProfit = totalIncome - totalExpenses
  const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

  if (clientLoading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass h-24 animate-shimmer" />)}</div>
        <div className="glass h-96 animate-shimmer" />
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

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Total Revenue" value={formatCurrency(totalIncome)} positive={true} sub={`${transactions.filter((t) => t.type === "INCOME").length} transactions`} />
        <SummaryCard label="Total Expenses" value={formatCurrency(totalExpenses)} positive={false} sub={`${transactions.filter((t) => t.type === "EXPENSE").length} transactions`} />
        <SummaryCard label="Net Profit" value={formatCurrency(netProfit)} positive={netProfit >= 0} sub="cumulative" />
        <SummaryCard label="Net Margin" value={`${margin.toFixed(1)}%`} positive={margin >= 0} sub="revenue basis" />
      </div>

      {/* Filters */}
      <div className="glass p-4 flex flex-wrap gap-3 items-center animate-fade-up delay-100">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
          {TYPE_FILTERS.map((f) => (
            <button key={f} onClick={() => setTypeFilter(f)} className={cn("px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-150", typeFilter === f ? "bg-[var(--primary)] text-white shadow-sm" : "text-slate-400 hover:text-white")}>
              {f}
            </button>
          ))}
        </div>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-[var(--border)] text-xs text-slate-300 focus:outline-none focus:border-[var(--primary)] transition-colors">
          {categories.map((c) => <option key={c} value={c} className="bg-[#111827]">{c}</option>)}
        </select>

        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[var(--primary)] transition-colors" />
        </div>

        <span className="text-xs text-slate-600">{filtered.length} of {transactions.length}</span>

        {isAdmin && (
          <button onClick={() => setAddOpen(true)} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity">
            <Plus size={13} /> Add
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden animate-fade-up delay-150">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {(["date", "description", "category", "type", "amount"] as const).map((key) => {
                  const labels: Record<string, string> = { date: "Date", description: "Description", category: "Category", type: "Type", amount: "Amount" }
                  const sortable = key !== "type"
                  return (
                    <th key={key} onClick={() => sortable && toggleSort(key as SortKey)} className={cn("px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 text-left", sortable && "cursor-pointer hover:text-slate-300 transition-colors select-none", key === "amount" && "text-right")}>
                      <span className="inline-flex items-center gap-1">
                        {labels[key]}
                        {sortable && <SortIcon col={key as SortKey} sortKey={sortKey} dir={sortDir} />}
                      </span>
                    </th>
                  )
                })}
                {isAdmin && <th className="px-5 py-3 w-10" />}
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]/50">
                  {[120, 200, 140, 80, 100].map((w, ci) => (
                    <td key={ci} className="px-5 py-3.5"><div className="h-3 rounded animate-shimmer" style={{ width: w, background: "rgba(255,255,255,0.05)" }} /></td>
                  ))}
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 6 : 5} className="px-5 py-16 text-center text-slate-600 text-sm">No transactions found</td></tr>
              )}

              {!loading && filtered.map((tx) => {
                const catColor = CATEGORY_COLORS[tx.category] ?? "#64748b"
                return (
                  <tr key={tx.id} className="border-b border-[var(--border)]/40 hover:bg-white/[0.03] transition-colors group">
                    <td className="px-5 py-3.5 text-slate-400 text-xs tabular whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-white font-medium">{tx.description}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}35` }}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("flex items-center gap-1 text-[11px] font-semibold w-fit px-2 py-0.5 rounded-full", tx.type === "INCOME" ? "text-[var(--positive)] bg-[var(--positive-dim)]" : "text-[var(--negative)] bg-[var(--negative-dim)]")}>
                        {tx.type === "INCOME" ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {tx.type === "INCOME" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td className={cn("px-5 py-3.5 text-right font-semibold tabular", tx.type === "INCOME" ? "text-[var(--positive)]" : "text-[var(--negative)]")}>
                      {tx.type === "EXPENSE" ? "−" : "+"}{formatCurrency(tx.amount)}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5">
                        <button onClick={() => handleDelete(tx.id)} disabled={deletingId === tx.id} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-[var(--negative)] transition-all disabled:opacity-30">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AddTransactionModal open={addOpen} clientId={selected?.id} onClose={() => setAddOpen(false)} onSaved={load} />
    </div>
  )
}
