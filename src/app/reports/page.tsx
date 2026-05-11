"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useClient } from "@/lib/client-context"
import { formatCurrency } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, DollarSign, BarChart2 } from "lucide-react"

interface Transaction {
  id: string; date: string; description: string; category: string; type: string; amount: number
}

interface MonthRow {
  month: string; label: string; revenue: number; expenses: number; net: number; margin: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-solid rounded-xl p-3 border border-[var(--border-strong)] shadow-xl text-xs">
      <div className="font-semibold text-white mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-6">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className="text-white tabular">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const { selected, isLoading: clientLoading } = useClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

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

  const monthlyData = useMemo((): MonthRow[] => {
    const map: Record<string, { revenue: number; expenses: number }> = {}
    for (const tx of transactions) {
      const d = new Date(tx.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (!map[key]) map[key] = { revenue: 0, expenses: 0 }
      if (tx.type === "INCOME") map[key].revenue += tx.amount
      else map[key].expenses += tx.amount
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => {
        const [y, m] = month.split("-").map(Number)
        const net = v.revenue - v.expenses
        const margin = v.revenue > 0 ? (net / v.revenue) * 100 : 0
        return {
          month,
          label: new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          revenue: v.revenue,
          expenses: v.expenses,
          net,
          margin,
        }
      })
  }, [transactions])

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {}
    for (const tx of transactions) {
      if (!map[tx.category]) map[tx.category] = { income: 0, expense: 0 }
      if (tx.type === "INCOME") map[tx.category].income += tx.amount
      else map[tx.category].expense += tx.amount
    }
    return Object.entries(map)
      .map(([cat, v]) => ({ cat, ...v, net: v.income - v.expense }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
  }, [transactions])

  const totals = useMemo(() => {
    const revenue = monthlyData.reduce((s, r) => s + r.revenue, 0)
    const expenses = monthlyData.reduce((s, r) => s + r.expenses, 0)
    const net = revenue - expenses
    const margin = revenue > 0 ? (net / revenue) * 100 : 0
    return { revenue, expenses, net, margin }
  }, [monthlyData])

  if (clientLoading || loading || (selected && transactions.length === 0 && loading)) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass h-24 animate-shimmer" />)}</div>
        <div className="glass h-72 animate-shimmer" />
        <div className="glass h-64 animate-shimmer" />
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="text-slate-500 font-medium mb-1">No portfolio company selected</div>
          <div className="text-slate-600 text-sm">Select a client to view financial reports</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="animate-slide-up">
        <h1 className="text-xl font-bold text-white tracking-tight">Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Profit & Loss summary and category breakdown</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total Revenue", value: formatCurrency(totals.revenue), icon: <TrendingUp size={13} />, color: "var(--positive)" },
          { label: "Total Expenses", value: formatCurrency(totals.expenses), icon: <TrendingDown size={13} />, color: "var(--negative)" },
          { label: "Net Income", value: formatCurrency(totals.net), icon: <DollarSign size={13} />, color: totals.net >= 0 ? "var(--positive)" : "var(--negative)" },
          { label: "Net Margin", value: `${totals.margin.toFixed(1)}%`, icon: <BarChart2 size={13} />, color: totals.margin >= 0 ? "var(--primary)" : "var(--negative)" },
        ].map((card) => (
          <div key={card.label} className="glass p-5 animate-fade-up">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
              <span style={{ color: card.color }}>{card.icon}</span>
              {card.label}
            </div>
            <div className="text-2xl font-bold tabular" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      {monthlyData.length > 0 && (
        <div className="glass p-5 animate-fade-up delay-100">
          <div className="mb-4">
            <div className="text-sm font-semibold text-white">Monthly P&L</div>
            <div className="text-xs text-slate-500 mt-0.5">Revenue vs expenses by month</div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 12 }} />
              <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ff5c6a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly P&L table */}
      {monthlyData.length > 0 && (
        <div className="glass overflow-hidden animate-fade-up delay-150">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <div className="text-sm font-semibold text-white">P&L Statement</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Month", "Revenue", "Expenses", "Net Income", "Margin"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...monthlyData].reverse().map((row) => (
                  <tr key={row.month} className="border-b border-[var(--border)]/40 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-slate-300 text-xs font-medium">{row.label}</td>
                    <td className="px-5 py-3 text-[var(--positive)] tabular text-xs">{formatCurrency(row.revenue)}</td>
                    <td className="px-5 py-3 text-[var(--negative)] tabular text-xs">{formatCurrency(row.expenses)}</td>
                    <td className={cn("px-5 py-3 tabular text-xs font-semibold", row.net >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]")}>
                      {row.net >= 0 ? "+" : "−"}{formatCurrency(Math.abs(row.net))}
                    </td>
                    <td className={cn("px-5 py-3 text-right tabular text-xs font-medium", row.margin >= 0 ? "text-[var(--primary)]" : "text-[var(--negative)]")}>
                      {row.margin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-white/[0.03] border-t border-[var(--border)]">
                  <td className="px-5 py-3 text-white text-xs font-bold">Total</td>
                  <td className="px-5 py-3 text-[var(--positive)] tabular text-xs font-bold">{formatCurrency(totals.revenue)}</td>
                  <td className="px-5 py-3 text-[var(--negative)] tabular text-xs font-bold">{formatCurrency(totals.expenses)}</td>
                  <td className={cn("px-5 py-3 tabular text-xs font-bold", totals.net >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]")}>
                    {totals.net >= 0 ? "+" : "−"}{formatCurrency(Math.abs(totals.net))}
                  </td>
                  <td className={cn("px-5 py-3 text-right tabular text-xs font-bold", totals.margin >= 0 ? "text-[var(--primary)]" : "text-[var(--negative)]")}>
                    {totals.margin.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="glass overflow-hidden animate-fade-up delay-200">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <div className="text-sm font-semibold text-white">Category Breakdown</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Category", "Revenue", "Expenses", "Net"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 text-left last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map((row) => (
                  <tr key={row.cat} className="border-b border-[var(--border)]/40 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-white text-xs font-medium">{row.cat}</td>
                    <td className="px-5 py-3 text-[var(--positive)] tabular text-xs">{row.income > 0 ? formatCurrency(row.income) : "—"}</td>
                    <td className="px-5 py-3 text-[var(--negative)] tabular text-xs">{row.expense > 0 ? formatCurrency(row.expense) : "—"}</td>
                    <td className={cn("px-5 py-3 text-right tabular text-xs font-semibold", row.net >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]")}>
                      {row.net >= 0 ? "+" : "−"}{formatCurrency(Math.abs(row.net))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="glass flex items-center justify-center py-24 animate-fade-up">
          <div className="text-center">
            <div className="text-slate-500 font-medium mb-1">No transaction data</div>
            <div className="text-slate-600 text-sm">Import or add transactions to generate reports</div>
          </div>
        </div>
      )}
    </div>
  )
}
