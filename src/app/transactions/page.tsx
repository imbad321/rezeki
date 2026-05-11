"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useClient } from "@/lib/client-context"
import { formatCurrency } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, Search, Filter, TrendingUp, TrendingDown, DollarSign, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  date: string
  description: string
  category: string
  type: string
  amount: number
}

const TYPE_FILTERS = ["All", "Income", "Expenses"] as const
type TypeFilter = (typeof TYPE_FILTERS)[number]

function SummaryCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className={cn(
      "glass p-4 flex flex-col gap-2 animate-fade-up",
      positive === true  && "glow-green",
      positive === false && "glow-red",
    )}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className={cn("text-xl font-bold tabular", positive === true ? "text-[var(--positive)]" : positive === false ? "text-[var(--negative)]" : "text-white")}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-slate-600">{sub}</div>}
    </div>
  )
}

export default function TransactionsPage() {
  const { selected, isLoading: clientLoading } = useClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("All")
  const [search, setSearch] = useState("")

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
      const a = document.createElement("a")
      a.href = `/api/export?clientId=${selected.id}`
      a.download = ""
      a.click()
    }
    document.addEventListener("meridian:export", handler)
    return () => document.removeEventListener("meridian:export", handler)
  }, [selected])

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchType =
        typeFilter === "All" ? true :
        typeFilter === "Income" ? tx.type === "INCOME" :
        tx.type === "EXPENSE"
      const q = search.toLowerCase()
      const matchSearch = !q || tx.description.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q)
      return matchType && matchSearch
    })
  }, [transactions, typeFilter, search])

  const totalIncome   = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0)
  const netProfit     = totalIncome - totalExpenses
  const margin        = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

  const CATEGORY_COLORS: Record<string, string> = {
    "SaaS Subscriptions": "#6366f1", "Professional Services": "#a78bfa",
    "API Usage": "#22d3ee",          "Enterprise Licenses": "#f59e0b",
    "Platform Revenue": "#34d399",   "Marketplace": "#22d3a5",
    "Payroll": "#ff5c6a",            "Infrastructure": "#fb923c",
    "Sales & Marketing": "#f472b6",  "R&D Tools": "#60a5fa",
    "Office & Admin": "#94a3b8",     "Legal & Compliance": "#fbbf24",
  }

  if (clientLoading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass h-24 animate-shimmer" />
          ))}
        </div>
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

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Total Revenue"  value={formatCurrency(totalIncome)}   positive={true}  sub={`${transactions.filter(t=>t.type==="INCOME").length} transactions`} />
        <SummaryCard label="Total Expenses" value={formatCurrency(totalExpenses)} positive={false} sub={`${transactions.filter(t=>t.type==="EXPENSE").length} transactions`} />
        <SummaryCard label="Net Profit"     value={formatCurrency(netProfit)}     positive={netProfit >= 0} sub="cumulative" />
        <SummaryCard label="Net Margin"     value={`${margin.toFixed(1)}%`}       positive={margin >= 0}   sub="revenue basis" />
      </div>

      {/* Filters */}
      <div className="glass p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center animate-fade-up delay-100">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
                typeFilter === f
                  ? "bg-[var(--primary)] text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[var(--primary)] focus:bg-white/8 transition-colors"
          />
        </div>

        <div className="ml-auto text-xs text-slate-600 shrink-0">
          {filtered.length} of {transactions.length}
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden animate-fade-up delay-150">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Date</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Description</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Type</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)]/50">
                  {[120, 200, 140, 80, 100].map((w, ci) => (
                    <td key={ci} className="px-5 py-3.5">
                      <div className="h-3 rounded animate-shimmer" style={{ width: w, background: "rgba(255,255,255,0.05)" }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-slate-600 text-sm">
                    No transactions found
                  </td>
                </tr>
              )}

              {!loading && filtered.map((tx, i) => {
                const catColor = CATEGORY_COLORS[tx.category] ?? "#64748b"
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-[var(--border)]/40 hover:bg-white/3 transition-colors"
                    style={{ animationDelay: `${i * 15}ms` }}
                  >
                    <td className="px-5 py-3.5 text-slate-400 text-xs tabular whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5 text-white font-medium">{tx.description}</td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}35` }}
                      >
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        "flex items-center gap-1 text-[11px] font-semibold w-fit px-2 py-0.5 rounded-full",
                        tx.type === "INCOME"
                          ? "text-[var(--positive)] bg-[var(--positive-dim)]"
                          : "text-[var(--negative)] bg-[var(--negative-dim)]"
                      )}>
                        {tx.type === "INCOME" ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {tx.type === "INCOME" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td className={cn(
                      "px-5 py-3.5 text-right font-semibold tabular",
                      tx.type === "INCOME" ? "text-[var(--positive)]" : "text-[var(--negative)]"
                    )}>
                      {tx.type === "EXPENSE" ? "−" : "+"}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
