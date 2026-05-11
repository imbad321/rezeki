"use client"

import { useState, useEffect, useCallback } from "react"
import { useClient } from "@/lib/client-context"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Save, TrendingUp, Wallet, Users, BarChart2, ChevronLeft, ChevronRight } from "lucide-react"

interface MonthData {
  mrr: string
  newMrr: string
  expansion: string
  churn: string
  cashOnHand: string
  burnRate: string
  headcount: string
}

const EMPTY: MonthData = {
  mrr: "", newMrr: "", expansion: "", churn: "",
  cashOnHand: "", burnRate: "", headcount: "",
}

function toNum(s: string) { return parseFloat(s.replace(/[^0-9.\-]/g, "")) || 0 }

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

function Field({
  label, value, onChange, prefix, suffix, hint
}: {
  label: string; value: string; onChange: (v: string) => void
  prefix?: string; suffix?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{prefix}</span>
        )}
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)] transition-colors tabular",
            prefix ? "pl-7 pr-3" : "px-3",
            suffix ? "pr-10" : ""
          )}
          placeholder="0"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{suffix}</span>
        )}
      </div>
      {hint && <p className="text-[10px] text-slate-600 mt-1">{hint}</p>}
    </div>
  )
}

interface HistoryRow {
  month: string
  mrr: number
  cashOnHand: number
  burnRate: number
  headcount: number
  arr: number
}

export default function MetricsPage() {
  const { selected } = useClient()
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [month, setMonth]   = useState(defaultMonth)
  const [form, setForm]     = useState<MonthData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Load existing data for selected month
  useEffect(() => {
    if (!selected) return
    fetch(`/api/metrics?clientId=${selected.id}&month=${month}`)
      .then((r) => r.json())
      .then(({ mrrPoints, snapshots }) => {
        const mrr = mrrPoints[0]
        const snap = snapshots[0]
        setForm({
          mrr:       mrr  ? String(mrr.mrr)       : "",
          newMrr:    mrr  ? String(mrr.newMrr)    : "",
          expansion: mrr  ? String(mrr.expansion) : "",
          churn:     mrr  ? String(mrr.churn)     : "",
          cashOnHand: snap ? String(snap.cashOnHand) : "",
          burnRate:   snap ? String(snap.burnRate)   : "",
          headcount:  snap ? String(snap.headcount)  : "",
        })
      })
      .catch(() => {})
  }, [selected, month])

  // Load history
  const loadHistory = useCallback(() => {
    if (!selected) return
    setLoadingHistory(true)
    fetch(`/api/metrics?clientId=${selected.id}`)
      .then((r) => r.json())
      .then(({ mrrPoints, snapshots }) => {
        const snapshotMap: Record<string, any> = {}
        for (const s of snapshots) {
          snapshotMap[s.snapshotDate.slice(0, 7)] = s
        }
        const rows: HistoryRow[] = mrrPoints.map((p: any) => {
          const mo = p.month.slice(0, 7)
          const snap = snapshotMap[mo] ?? {}
          return {
            month: mo,
            mrr: p.mrr,
            cashOnHand: snap.cashOnHand ?? 0,
            burnRate: snap.burnRate ?? 0,
            headcount: snap.headcount ?? 0,
            arr: snap.arr ?? p.mrr * 12,
          }
        })
        setHistory(rows)
        setLoadingHistory(false)
      })
      .catch(() => setLoadingHistory(false))
  }, [selected])

  useEffect(() => { loadHistory() }, [loadHistory])

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    setSaved(false)
    try {
      await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId:  selected.id,
          month,
          mrr:       toNum(form.mrr),
          newMrr:    toNum(form.newMrr),
          expansion: toNum(form.expansion),
          churn:     toNum(form.churn),
          cashOnHand: toNum(form.cashOnHand),
          burnRate:   toNum(form.burnRate),
          headcount:  toNum(form.headcount),
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      loadHistory()
    } finally {
      setSaving(false)
    }
  }

  function set(k: keyof MonthData) {
    return (v: string) => setForm((f) => ({ ...f, [k]: v }))
  }

  const arr = toNum(form.mrr) * 12
  const runway = toNum(form.burnRate) > 0
    ? (toNum(form.cashOnHand) / toNum(form.burnRate)).toFixed(1)
    : "—"

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Financial Metrics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Enter data that can't be imported from bank statements</p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Revenue */}
        <div className="glass p-5 space-y-4 animate-slide-up delay-50">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-[var(--primary)]" />
            <div className="text-sm font-semibold text-white">Revenue Metrics</div>
          </div>
          <Field label="MRR (Monthly Recurring Revenue)" value={form.mrr} onChange={set("mrr")} prefix="$"
            hint="Total monthly recurring revenue" />
          <Field label="New MRR" value={form.newMrr} onChange={set("newMrr")} prefix="$"
            hint="Revenue from new customers this month" />
          <Field label="Expansion MRR" value={form.expansion} onChange={set("expansion")} prefix="$"
            hint="Upgrades and upsells" />
          <Field label="Churned MRR" value={form.churn} onChange={set("churn")} prefix="$"
            hint="Lost from cancellations/downgrades" />

          {toNum(form.mrr) > 0 && (
            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-xs text-slate-500">ARR (calculated)</span>
              <span className="text-sm font-semibold text-[var(--primary)] tabular">{formatCurrency(arr)}</span>
            </div>
          )}
        </div>

        {/* Operations */}
        <div className="glass p-5 space-y-4 animate-slide-up delay-100">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={14} className="text-[var(--gold)]" />
            <div className="text-sm font-semibold text-white">Operations</div>
          </div>
          <Field label="Cash on Hand" value={form.cashOnHand} onChange={set("cashOnHand")} prefix="$"
            hint="Total cash in bank accounts" />
          <Field label="Monthly Burn Rate" value={form.burnRate} onChange={set("burnRate")} prefix="$"
            hint="Net cash spent per month" />
          <Field label="Headcount" value={form.headcount} onChange={set("headcount")} suffix="people"
            hint="Total full-time employees" />

          {toNum(form.cashOnHand) > 0 && toNum(form.burnRate) > 0 && (
            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-xs text-slate-500">Runway (calculated)</span>
              <span className={cn(
                "text-sm font-semibold tabular",
                parseFloat(runway) >= 18 ? "text-[var(--positive)]"
                  : parseFloat(runway) >= 12 ? "text-[var(--warning)]"
                  : "text-[var(--negative)]"
              )}>
                {runway} months
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 animate-slide-up delay-150">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
        >
          <Save size={14} />
          {saving ? "Saving…" : `Save ${new Date(month + "-01").toLocaleDateString("en-CA", { month: "long", year: "numeric" })}`}
        </button>
        {saved && <span className="text-xs text-[var(--positive)]">Saved successfully</span>}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="glass overflow-hidden animate-slide-up delay-200">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <div className="text-sm font-semibold text-white">History</div>
            <div className="text-xs text-slate-500 mt-0.5">All saved metric entries</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Month","MRR","ARR","Cash on Hand","Burn Rate","Headcount","Runway"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingHistory ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600 text-xs">Loading…</td></tr>
                ) : history.map((row) => {
                  const runwayMo = row.burnRate > 0 ? row.cashOnHand / row.burnRate : 0
                  return (
                    <tr
                      key={row.month}
                      onClick={() => setMonth(row.month)}
                      className={cn(
                        "border-b border-[var(--border)]/40 hover:bg-white/[0.02] cursor-pointer transition-colors",
                        row.month === month && "bg-[var(--accent)]"
                      )}
                    >
                      <td className="px-4 py-3 text-white text-xs font-medium">
                        {new Date(row.month + "-01").toLocaleDateString("en-CA", { month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-[var(--positive)] tabular text-xs">{formatCurrency(row.mrr)}</td>
                      <td className="px-4 py-3 text-[var(--gold)] tabular text-xs">{formatCurrency(row.arr)}</td>
                      <td className="px-4 py-3 text-white tabular text-xs">{formatCurrency(row.cashOnHand)}</td>
                      <td className="px-4 py-3 text-[var(--negative)] tabular text-xs">{formatCurrency(row.burnRate)}</td>
                      <td className="px-4 py-3 text-slate-400 tabular text-xs">{row.headcount}</td>
                      <td className={cn("px-4 py-3 tabular text-xs font-medium",
                        runwayMo >= 18 ? "text-[var(--positive)]" : runwayMo >= 12 ? "text-[var(--warning)]" : "text-[var(--negative)]"
                      )}>
                        {runwayMo > 0 ? `${runwayMo.toFixed(1)} mo` : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
