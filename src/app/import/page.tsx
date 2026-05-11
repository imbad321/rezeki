"use client"

import { useState, useCallback, useRef } from "react"
import { useClient } from "@/lib/client-context"
import { TRANSACTION_CATEGORIES } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Upload, FileText, Check, ArrowLeft, AlertCircle, ChevronDown } from "lucide-react"

// ── CSV helpers ───────────────────────────────────────────────────────────────

function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const lines = clean.split("\n").filter((l) => l.trim())
  const sample = lines[0] ?? ""
  const delim = sample.split(";").length > sample.split(",").length ? ";" : ","

  return lines.map((line) => {
    const fields: string[] = []
    let cur = ""
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (ch === delim && !inQ) {
        fields.push(cur.trim())
        cur = ""
      } else {
        cur += ch
      }
    }
    fields.push(cur.trim())
    return fields
  })
}

function normHeader(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function detectCols(headers: string[]) {
  const h = headers.map(normHeader)
  const find = (...terms: string[]) => {
    for (const t of terms) {
      const i = h.findIndex((s) => s.includes(t))
      if (i !== -1) return i
    }
    return -1
  }
  return {
    date:   find("date", "transactiondate", "valuedate", "postingdate"),
    desc:   find("description", "narration", "narr", "particulars", "details", "memo", "narrative", "reference", "remarks", "transaction"),
    amount: find("amount", "value", "sum", "net"),
    credit: find("creditamount", "credit", "deposit", "depositing", "crediting"),
    debit:  find("debitamount", "debit", "withdrawal", "withdrawing", "debiting"),
  }
}

function parseDate(val: string): string {
  const v = val.trim().replace(/['"]/g, "")
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
  const slash = v.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (slash) {
    const [, a, b, c] = slash
    const year = c.length === 2 ? `20${c}` : c
    if (parseInt(a) > 12) return `${year}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`
    return `${year}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`
  }
  try {
    const d = new Date(v)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  } catch { /* ignore */ }
  return new Date().toISOString().slice(0, 10)
}

function autoCategory(desc: string): string {
  const d = desc.toLowerCase()
  if (/salary|payroll|wages|stipend/i.test(d))                                              return "Payroll"
  if (/\baws\b|azure|gcp|google cloud|digitalocean|cloudflare|hetzner|vercel|netlify/i.test(d)) return "Infrastructure"
  if (/stripe|payment received|invoice paid|subscription revenue|saas revenue/i.test(d))   return "Platform Revenue"
  if (/slack|notion|github|figma|jira|atlassian|zoom|dropbox|hubspot|salesforce|linear/i.test(d)) return "SaaS Subscriptions"
  if (/legal|attorney|lawyer|compliance|audit|kpmg|deloitte|pwc|\bey\b|ernst|baker/i.test(d)) return "Legal & Compliance"
  if (/marketing|facebook ads|google ads|\bmeta\b|linkedin ads|tiktok|influencer/i.test(d)) return "Sales & Marketing"
  if (/consulting|advisory|professional services|contractor/i.test(d))                      return "Professional Services"
  if (/openai|anthropic|twilio|sendgrid|segment|mixpanel|amplitude|datadog|sentry/i.test(d)) return "API Usage"
  if (/r&d|research|development|jetbrains|vscode|cursor|testing tools/i.test(d))            return "R&D Tools"
  if (/enterprise|software license|perpetual license/i.test(d))                             return "Enterprise Licenses"
  if (/marketplace|app store|play store/i.test(d))                                          return "Marketplace"
  return "Office & Admin"
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImportRow {
  date: string
  description: string
  category: string
  type: "INCOME" | "EXPENSE"
  amount: number
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handle(f: File | null | undefined) {
    if (f && (f.name.endsWith(".csv") || f.name.endsWith(".tsv") || f.type.includes("csv") || f.type.includes("text"))) {
      onFile(f)
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]) }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "glass rounded-2xl flex flex-col items-center justify-center gap-4 py-16 cursor-pointer transition-all duration-200",
        drag ? "border-[var(--primary)] bg-[var(--accent)] scale-[1.01]" : "hover:border-white/15 hover:bg-white/[0.02]"
      )}
    >
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
        drag ? "bg-[var(--accent)]" : "bg-white/5"
      )}>
        <Upload size={24} className={drag ? "text-[var(--primary)]" : "text-slate-500"} />
      </div>
      <div className="text-center">
        <div className="text-white font-semibold mb-1">Drop your bank statement here</div>
        <div className="text-slate-500 text-sm">or click to browse files</div>
        <div className="text-slate-600 text-xs mt-2">Supports CSV exports from any bank or accounting tool</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.tsv,text/csv"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </div>
  )
}

function TypeToggle({ value, onChange }: { value: "INCOME" | "EXPENSE"; onChange: (v: "INCOME" | "EXPENSE") => void }) {
  return (
    <button
      onClick={() => onChange(value === "INCOME" ? "EXPENSE" : "INCOME")}
      className={cn(
        "text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap transition-colors",
        value === "INCOME"
          ? "bg-[var(--positive-dim)] text-[var(--positive)]"
          : "bg-[var(--negative-dim)] text-[var(--negative)]"
      )}
    >
      {value === "INCOME" ? "Income" : "Expense"}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const { clients, selected, setSelected } = useClient()
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload")
  const [rows, setRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [parseError, setParseError] = useState("")

  const clientId = selected?.id ?? ""

  function handleFile(file: File) {
    setParseError("")
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const table = parseCsv(text)
        if (table.length < 2) { setParseError("File appears empty or unrecognised"); return }
        const headers = table[0]
        const dataRows = table.slice(1)
        const cols = detectCols(headers)

        if (cols.date === -1) { setParseError("Could not find a Date column. Check the file has a header row."); return }
        if (cols.desc === -1) { setParseError("Could not find a Description column."); return }
        if (cols.amount === -1 && (cols.credit === -1 || cols.debit === -1)) {
          setParseError("Could not find Amount or Credit/Debit columns."); return
        }

        const parsed: ImportRow[] = []
        for (const row of dataRows) {
          const date = parseDate(row[cols.date] ?? "")
          const description = (row[cols.desc] ?? "").trim()
          if (!description) continue

          let amount = 0
          let type: "INCOME" | "EXPENSE" = "EXPENSE"

          if (cols.credit !== -1 && cols.debit !== -1) {
            const credit = parseFloat((row[cols.credit] ?? "").replace(/[^0-9.]/g, "")) || 0
            const debit  = parseFloat((row[cols.debit]  ?? "").replace(/[^0-9.]/g, "")) || 0
            if (credit > 0)     { amount = credit; type = "INCOME" }
            else if (debit > 0) { amount = debit;  type = "EXPENSE" }
            else continue
          } else {
            const raw = (row[cols.amount] ?? "").replace(/[^0-9.\-]/g, "")
            const n = parseFloat(raw)
            if (!n) continue
            amount = Math.abs(n)
            type = n > 0 ? "INCOME" : "EXPENSE"
          }

          parsed.push({ date, description, category: autoCategory(description), type, amount })
        }

        if (parsed.length === 0) { setParseError("No valid transactions found in file."); return }
        setRows(parsed)
        setStep("preview")
      } catch {
        setParseError("Failed to parse file. Make sure it's a valid CSV export.")
      }
    }
    reader.readAsText(file)
  }

  function updateRow(i: number, patch: Partial<ImportRow>) {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  }

  async function handleImport() {
    if (!clientId) return
    setImporting(true)
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, transactions: rows }),
      })
      const data = await res.json()
      setImportedCount(data.imported ?? 0)
      setStep("done")
    } catch {
      setParseError("Import failed. Please try again.")
    } finally {
      setImporting(false)
    }
  }

  const totalIncome   = rows.filter((r) => r.type === "INCOME").reduce((s, r) => s + r.amount, 0)
  const totalExpenses = rows.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + r.amount, 0)

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-xl font-bold text-white tracking-tight">Import Bank Statement</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Upload a CSV export to add transactions to a portfolio company
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 animate-slide-up delay-50">
        {(["upload", "preview", "done"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-[var(--border)]" />}
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                step === s
                  ? "bg-[var(--primary)] text-white"
                  : (i < ["upload","preview","done"].indexOf(step))
                    ? "bg-[var(--positive-dim)] text-[var(--positive)]"
                    : "bg-white/5 text-slate-600"
              )}>
                {i < ["upload","preview","done"].indexOf(step) ? <Check size={10} /> : i + 1}
              </div>
              <span className={cn(
                "text-xs font-medium capitalize",
                step === s ? "text-white" : "text-slate-600"
              )}>
                {s === "upload" ? "Upload" : s === "preview" ? "Review" : "Done"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Upload step ── */}
      {step === "upload" && (
        <div className="space-y-4 animate-slide-up delay-100">
          {/* Client selector */}
          <div className="glass p-4">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
              Portfolio Company
            </label>
            {clients.length === 0 ? (
              <p className="text-sm text-slate-500">
                No clients yet. <a href="/clients" className="text-[var(--primary)] hover:underline">Add one first →</a>
              </p>
            ) : (
              <div className="relative">
                <select
                  value={clientId}
                  onChange={(e) => {
                    const c = clients.find((x) => x.id === e.target.value)
                    if (c) setSelected(c)
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-sm text-white appearance-none focus:outline-none focus:border-[var(--primary)] transition-colors"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Drop zone */}
          {clients.length > 0 && <DropZone onFile={handleFile} />}

          {/* Error */}
          {parseError && (
            <div className="glass p-4 flex items-start gap-3 border-[var(--negative-dim)]">
              <AlertCircle size={15} className="text-[var(--negative)] shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--negative)]">{parseError}</p>
            </div>
          )}

          {/* Format tips */}
          <div className="glass-solid p-5 rounded-2xl space-y-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Format Tips</div>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary)] shrink-0 mt-0.5">✓</span>
                Export your statement as <strong className="text-slate-300">CSV</strong> from your bank or accounting software
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary)] shrink-0 mt-0.5">✓</span>
                File must have a header row with at least: <strong className="text-slate-300">Date, Description, Amount</strong> columns (or Credit / Debit split)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary)] shrink-0 mt-0.5">✓</span>
                Works with Mercury, Revolut, Wise, HSBC, Barclays, QuickBooks, Xero exports
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--primary)] shrink-0 mt-0.5">✓</span>
                Negative amounts are detected as expenses; positive as income
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Preview step ── */}
      {step === "preview" && (
        <div className="space-y-4 animate-slide-up">
          {/* Summary bar */}
          <div className="glass p-4 flex items-center gap-6">
            <div>
              <div className="text-xl font-bold text-white tabular">{rows.length}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Transactions</div>
            </div>
            <div className="w-px h-8 bg-[var(--border)]" />
            <div>
              <div className="text-xl font-bold text-[var(--positive)] tabular">{formatCurrency(totalIncome)}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Income</div>
            </div>
            <div className="w-px h-8 bg-[var(--border)]" />
            <div>
              <div className="text-xl font-bold text-[var(--negative)] tabular">{formatCurrency(totalExpenses)}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Expenses</div>
            </div>
            <div className="ml-auto text-xs text-slate-500">
              Importing into <strong className="text-white">{selected?.name}</strong>
            </div>
          </div>

          {/* Table */}
          <div className="glass overflow-hidden">
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-[#0d1117]">
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Date</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Description</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Category</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Type</th>
                    <th className="text-right px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border)]/40 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 text-slate-400 text-xs tabular whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2.5 text-white text-xs max-w-[200px] truncate" title={row.description}>
                        {row.description}
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={row.category}
                          onChange={(e) => updateRow(i, { category: e.target.value })}
                          className="text-[11px] bg-white/5 border border-[var(--border)] text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-[var(--primary)] transition-colors"
                        >
                          {TRANSACTION_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <TypeToggle value={row.type} onChange={(v) => updateRow(i, { type: v })} />
                      </td>
                      <td className={cn(
                        "px-4 py-2.5 text-right font-semibold tabular text-sm",
                        row.type === "INCOME" ? "text-[var(--positive)]" : "text-[var(--negative)]"
                      )}>
                        {row.type === "EXPENSE" ? "−" : "+"}{formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-between">
            <button
              onClick={() => { setStep("upload"); setRows([]); setParseError("") }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing || rows.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {importing ? "Importing…" : `Import ${rows.length} Transaction${rows.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Done step ── */}
      {step === "done" && (
        <div className="glass flex flex-col items-center justify-center py-20 gap-5 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-[var(--positive-dim)] flex items-center justify-center">
            <Check size={28} className="text-[var(--positive)]" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white mb-1">Import Complete</div>
            <div className="text-slate-400 text-sm">
              Successfully imported <strong className="text-white">{importedCount}</strong> transactions
              into <strong className="text-white">{selected?.name}</strong>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setStep("upload"); setRows([]); setImportedCount(0) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 border border-[var(--border)] transition-colors"
            >
              <Upload size={14} />
              Import Another
            </button>
            <a
              href="/transactions"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <FileText size={14} />
              View Transactions
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
