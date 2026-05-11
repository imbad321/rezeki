"use client"

import { useState, useRef } from "react"
import { useClient } from "@/lib/client-context"
import { TRANSACTION_CATEGORIES } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Upload, FileText, Check, ArrowLeft, AlertCircle, ChevronDown, Landmark } from "lucide-react"

// ═══════════════════════════════════════════════════════════════════════════════
// CSV parsing
// ═══════════════════════════════════════════════════════════════════════════════

function parseCsv(text: string): string[][] {
  const clean = text
    .replace(/^﻿/, "")   // BOM
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")

  const lines = clean.split("\n").filter((l) => l.trim())
  if (!lines.length) return []

  // Detect delimiter from the first few lines
  const sample = lines.slice(0, 3).join("\n")
  const tabs   = (sample.match(/\t/g) ?? []).length
  const semis  = (sample.match(/;/g) ?? []).length
  const commas = (sample.match(/,/g) ?? []).length
  const delim  = tabs > commas ? "\t" : semis > commas ? ";" : ","

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

// ═══════════════════════════════════════════════════════════════════════════════
// Date parsing — handles all Canadian bank formats
// ═══════════════════════════════════════════════════════════════════════════════

const MONTH_MAP: Record<string, string> = {
  // English
  jan:"01", feb:"02", mar:"03", apr:"04", may:"05", jun:"06",
  jul:"07", aug:"08", sep:"09", oct:"10", nov:"11", dec:"12",
  // French (Desjardins, National Bank)
  janv:"01", fevr:"02", mars:"03", avri:"04", avr:"04",
  juin:"06", juil:"07", aout:"08", aoû:"08", sept:"09",
  octo:"10", nove:"11", dece:"12", déce:"12",
}

function parseDate(raw: string): string {
  const v = raw.trim().replace(/^["']|["']$/g, "").replace(/ /g, " ")
  if (!v || v === "-" || v.toLowerCase() === "n/a") return new Date().toISOString().slice(0, 10)

  // YYYY-MM-DD or YYYY/MM/DD  (CIBC, RBC, Tangerine, Simplii)
  const iso = v.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2,"0")}-${iso[3].padStart(2,"0")}`

  // "Jan. 15, 2025" | "January 15 2025" | "janv. 15, 2025"  (BMO, some credit unions)
  const named = v.match(/^([A-Za-zéû]+)\.?\s+(\d{1,2}),?\s+(\d{4})/)
  if (named) {
    const key4 = named[1].toLowerCase().slice(0, 4)
    const key3 = named[1].toLowerCase().slice(0, 3)
    const m = MONTH_MAP[key4] ?? MONTH_MAP[key3]
    if (m) return `${named[3]}-${m}-${named[2].padStart(2, "0")}`
  }

  // MM/DD/YYYY or DD/MM/YYYY or MM-DD-YYYY etc.
  // Canadian standard (TD, Scotiabank, BMO alt) = MM/DD/YYYY
  const slash = v.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)
  if (slash) {
    const [, a, b, c] = slash
    const year = c.length === 2 ? `20${c}` : c
    return parseInt(a) > 12
      ? `${year}-${b.padStart(2,"0")}-${a.padStart(2,"0")}`  // DD/MM
      : `${year}-${a.padStart(2,"0")}-${b.padStart(2,"0")}`  // MM/DD (Canadian default)
  }

  try {
    const d = new Date(v)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  } catch { /* ignore */ }
  return new Date().toISOString().slice(0, 10)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Amount parsing — handles brackets, currency symbols, spaces
// ═══════════════════════════════════════════════════════════════════════════════

function parseAmt(raw: string): number {
  const v = raw.trim().replace(/^["']|["']$/g, "")
  if (!v) return 0
  // "(1,234.56)" → negative (some accounting exports)
  const neg = v.startsWith("(") && v.endsWith(")")
  const n = parseFloat(v.replace(/[^0-9.\-]/g, "")) || 0
  return neg ? -Math.abs(n) : n
}

// ═══════════════════════════════════════════════════════════════════════════════
// Column detection — maps normalized header names to indices
// ═══════════════════════════════════════════════════════════════════════════════

function normH(s: string) { return s.toLowerCase().replace(/[^a-z0-9]/g, "") }

function detectCols(headers: string[]) {
  const h = headers.map(normH)
  const find = (...terms: string[]) => {
    for (const t of terms) {
      const i = h.findIndex((s) => s === t || s.includes(t))
      if (i !== -1) return i
    }
    return -1
  }

  return {
    // Date — "Transaction Date" before plain "Date" to avoid RBC's "Account" prefix
    dateIdx:  find("transactiondate", "datedetransaction", "transdate", "posteddate", "valuedate", "postingdate", "date"),
    // Description — "Description 1" before "Description" for RBC split columns
    descIdx:  find("description1", "narration", "description", "particulars", "details", "memo", "narrative", "reference", "name", "transaction"),
    desc2Idx: find("description2"),  // RBC second description column
    // Amount — "CAD$" for RBC; "montant" for French banks
    amtIdx:   find("cad", "amount", "cadamount", "netamount", "value", "net", "montant"),
    // Credit (income) synonyms across all Canadian banks
    creditIdx: find("credit", "creditamount", "deposits", "deposit", "depositing", "crediting", "crédit"),
    // Debit (expense) synonyms
    debitIdx:  find("debit", "debitamount", "withdrawals", "withdrawal", "withdrawing", "debiting", "débit"),
    // Explicit type column (some TD / generic exports)
    typeIdx:   find("type", "transactiontype", "trantype"),
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Headerless detection — TD EasyWeb exports have no header row
// ═══════════════════════════════════════════════════════════════════════════════

function looksLikeDate(s: string): boolean {
  const v = s.trim()
  return (
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(v) ||
    /^\d{4}[\/\-]\d{2}[\/\-]\d{2}/.test(v) ||
    /^[A-Za-z]{3}[a-z]*\.?\s+\d{1,2},?\s+\d{4}/i.test(v)
  )
}

function looksLikeAmount(s: string): boolean {
  const v = s.trim()
  return /^-?\$?[\d,]+\.?\d*$/.test(v) || /^\([\d,]+\.?\d*\)$/.test(v)
}

function parseHeaderless(rows: string[][]): ImportRow[] {
  const result: ImportRow[] = []

  for (const row of rows) {
    if (row.length < 3) continue
    const date = parseDate(row[0])
    const col1 = (row[1] ?? "").trim().toUpperCase()

    // TD format: [Date, CREDIT|DEBIT, SignedAmount, Description, Balance]
    if (col1 === "CREDIT" || col1 === "DEBIT") {
      const amount = Math.abs(parseAmt(row[2] ?? ""))
      const description = (row[3] ?? "").trim()
      if (!description || !amount) continue
      result.push({
        date, description,
        category: autoCategory(description),
        type: col1 === "CREDIT" ? "INCOME" : "EXPENSE",
        amount,
      })
      continue
    }

    // Generic headerless: find desc and amount by type-sniffing each column
    let descIdx = -1, amtIdx = -1
    for (let i = 1; i < row.length; i++) {
      const v = row[i].trim()
      if (!v) continue
      if (amtIdx === -1 && looksLikeAmount(v) && !looksLikeDate(v)) { amtIdx = i; continue }
      if (descIdx === -1 && !looksLikeDate(v) && !looksLikeAmount(v)) descIdx = i
    }

    if (amtIdx === -1) continue
    const description = (descIdx !== -1 ? row[descIdx] : row[1]).trim()
    const rawAmt = parseAmt(row[amtIdx])
    if (!rawAmt || !description) continue

    result.push({
      date, description,
      category: autoCategory(description),
      type: rawAmt > 0 ? "INCOME" : "EXPENSE",
      amount: Math.abs(rawAmt),
    })
  }

  return result
}

// ═══════════════════════════════════════════════════════════════════════════════
// Category auto-detection — Canadian business context
// ═══════════════════════════════════════════════════════════════════════════════

function autoCategory(desc: string): string {
  if (/salary|payroll|wages|stipend|direct.?dep|dd |eft.?credit|paie|versement.?salaire/i.test(desc))
    return "Payroll"
  if (/\baws\b|amazon web services|azure|gcp|google cloud|digitalocean|cloudflare|hetzner|vercel|netlify/i.test(desc))
    return "Infrastructure"
  if (/stripe|payment received|invoice paid|e-?transfer (in|received)|virement.?reçu|interac.?e.?transfer/i.test(desc))
    return "Platform Revenue"
  if (/slack|notion|github|figma|jira|atlassian|zoom|dropbox|hubspot|salesforce|linear\.app|shortcut/i.test(desc))
    return "SaaS Subscriptions"
  if (/legal|attorney|lawyer|avocat|compliance|audit|kpmg|deloitte|pwc|\bey\b|ernst|baker|grantthornton/i.test(desc))
    return "Legal & Compliance"
  if (/marketing|facebook.?ads|google.?ads|\bmeta\b|linkedin.?ads|tiktok|instagram|twitter/i.test(desc))
    return "Sales & Marketing"
  if (/consulting|advisory|professional services|contractor|freelance|services-conseils/i.test(desc))
    return "Professional Services"
  if (/openai|anthropic|twilio|sendgrid|segment|mixpanel|amplitude|datadog|sentry|posthog/i.test(desc))
    return "API Usage"
  if (/r&d|research|development|jetbrains|vscode|cursor|testing/i.test(desc))
    return "R&D Tools"
  if (/enterprise|software license|perpetual license|site license/i.test(desc))
    return "Enterprise Licenses"
  if (/marketplace|app store|google play/i.test(desc))
    return "Marketplace"
  return "Office & Admin"
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main parse orchestrator
// ═══════════════════════════════════════════════════════════════════════════════

interface ImportRow {
  date: string
  description: string
  category: string
  type: "INCOME" | "EXPENSE"
  amount: number
}

interface ParseResult {
  rows: ImportRow[]
  bank?: string
  error?: string
}

function parseFile(text: string): ParseResult {
  const table = parseCsv(text)
  if (table.length < 2) return { rows: [], error: "File appears empty or unrecognised." }

  const firstRow = table[0]

  // ── Headerless (TD EasyWeb and similar) ──────────────────────────────────────
  if (looksLikeDate(firstRow[0] ?? "")) {
    const rows = parseHeaderless(table)
    if (!rows.length) return { rows: [], error: "No valid transactions found in file." }
    const hasTdType = table.some((r) => ["CREDIT","DEBIT"].includes((r[1] ?? "").trim().toUpperCase()))
    return { rows, bank: hasTdType ? "TD" : undefined }
  }

  // ── Has headers ───────────────────────────────────────────────────────────────
  const headers = firstRow
  const dataRows = table.slice(1).filter((r) => r.some((c) => c.trim()))
  const cols = detectCols(headers)

  // Bank fingerprinting
  const hStr = headers.map(normH).join(",")
  let bank: string | undefined
  if      (hStr.includes("accounttype") && (hStr.includes("cad") || hStr.includes("usd"))) bank = "RBC"
  else if (hStr.includes("item") && hStr.includes("transactiondescription"))               bank = "BMO"
  else if (hStr.includes("withdrawals") && hStr.includes("deposits"))                       bank = "Scotiabank"
  else if (hStr.includes("débit") || hStr.includes("crédit") || hStr.includes("datedetransaction")) bank = "Desjardins"
  else if (hStr.includes("debit") && hStr.includes("credit"))                               bank = "CIBC"

  // Validation
  if (cols.dateIdx === -1)
    return { rows: [], error: "Could not find a Date column. Ensure the file has a header row with 'Date' or 'Transaction Date'." }
  if (cols.descIdx === -1)
    return { rows: [], error: "Could not find a Description column." }
  if (cols.amtIdx === -1 && cols.creditIdx === -1 && cols.debitIdx === -1)
    return { rows: [], error: "No amount column found. Expected 'Amount', 'CAD$', 'Debit/Credit', or 'Withdrawals/Deposits'." }

  const rows: ImportRow[] = []

  for (const row of dataRows) {
    const rawDate = (row[cols.dateIdx] ?? "").trim()
    // Skip summary / balance rows
    if (!rawDate || /^(balance|opening|closing|total|n\/a)/i.test(rawDate)) continue

    const date = parseDate(rawDate)

    // Combine RBC's Description 1 + Description 2
    let description = (row[cols.descIdx] ?? "").trim()
    if (cols.desc2Idx !== -1 && cols.desc2Idx !== cols.descIdx) {
      const d2 = (row[cols.desc2Idx] ?? "").trim()
      if (d2 && d2 !== description) description = `${description} ${d2}`.trim()
    }
    if (!description) continue

    let type: "INCOME" | "EXPENSE" = "EXPENSE"
    let amount = 0

    // Explicit type column overrides sign detection
    const typeVal = cols.typeIdx !== -1 ? (row[cols.typeIdx] ?? "").trim().toUpperCase() : ""
    if (typeVal === "CREDIT") type = "INCOME"
    else if (typeVal === "DEBIT") type = "EXPENSE"

    if (cols.creditIdx !== -1 && cols.debitIdx !== -1) {
      // Split debit/credit columns (CIBC, Scotiabank, Desjardins, National)
      const credit = Math.abs(parseAmt(row[cols.creditIdx] ?? ""))
      const debit  = Math.abs(parseAmt(row[cols.debitIdx] ?? ""))
      if      (credit > 0) { amount = credit; type = "INCOME"  }
      else if (debit  > 0) { amount = debit;  type = "EXPENSE" }
      else continue
    } else if (cols.amtIdx !== -1) {
      // Signed single-amount column (RBC CAD$, BMO Amount, TD with headers)
      const raw = parseAmt(row[cols.amtIdx] ?? "")
      if (!raw) continue
      amount = Math.abs(raw)
      if (!typeVal) type = raw > 0 ? "INCOME" : "EXPENSE"
    } else {
      continue
    }

    rows.push({ date, description, category: autoCategory(description), type, amount })
  }

  if (!rows.length) return { rows: [], error: "No valid transactions found. Check that the data rows contain valid dates and amounts." }
  return { rows, bank }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI components
// ═══════════════════════════════════════════════════════════════════════════════

const BANK_BADGES: Record<string, string> = {
  TD: "#00B140",
  RBC: "#005DAA",
  BMO: "#0075BE",
  Scotiabank: "#EC111A",
  CIBC: "#C41F3E",
  Desjardins: "#006341",
}

function BankBadge({ bank }: { bank: string }) {
  const color = BANK_BADGES[bank]
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
      style={{ background: color ?? "#475569" }}
    >
      {bank} format detected
    </span>
  )
}

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handle(f: File | null | undefined) {
    if (f) onFile(f)
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
        <div className="text-slate-500 text-sm">or click to browse</div>
        <div className="text-slate-600 text-xs mt-2">Supports CSV exports from any bank</div>
      </div>
      <input ref={inputRef} type="file" accept=".csv,.tsv,text/csv,text/plain" className="hidden"
        onChange={(e) => handle(e.target.files?.[0])} />
    </div>
  )
}

function TypeToggle({ value, onChange }: { value: "INCOME" | "EXPENSE"; onChange: (v: "INCOME" | "EXPENSE") => void }) {
  return (
    <button
      onClick={() => onChange(value === "INCOME" ? "EXPENSE" : "INCOME")}
      className={cn(
        "text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap transition-colors",
        value === "INCOME" ? "bg-[var(--positive-dim)] text-[var(--positive)]" : "bg-[var(--negative-dim)] text-[var(--negative)]"
      )}
    >
      {value === "INCOME" ? "Income" : "Expense"}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════════

const STEPS = ["upload", "preview", "done"] as const
type Step = (typeof STEPS)[number]

export default function ImportPage() {
  const { clients, selected, setSelected } = useClient()
  const [step, setStep]         = useState<Step>("upload")
  const [rows, setRows]         = useState<ImportRow[]>([])
  const [detectedBank, setBank] = useState<string | undefined>()
  const [importing, setImporting]   = useState(false)
  const [importedCount, setCount]   = useState(0)
  const [parseError, setError]      = useState("")

  const clientId = selected?.id ?? ""

  function handleFile(file: File) {
    setError("")
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = parseFile(e.target?.result as string)
      if (result.error) { setError(result.error); return }
      setRows(result.rows)
      setBank(result.bank)
      setStep("preview")
    }
    reader.onerror = () => setError("Could not read file.")
    reader.readAsText(file, "utf-8")
  }

  function updateRow(i: number, patch: Partial<ImportRow>) {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  }

  async function handleImport() {
    if (!clientId) return
    setImporting(true)
    setError("")
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, transactions: rows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Import failed")
      setCount(data.imported ?? 0)
      setStep("done")
    } catch (e: any) {
      setError(e.message ?? "Import failed. Please try again.")
    } finally {
      setImporting(false)
    }
  }

  const totalIncome   = rows.filter((r) => r.type === "INCOME").reduce((s, r) => s + r.amount, 0)
  const totalExpenses = rows.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + r.amount, 0)
  const stepIdx       = STEPS.indexOf(step)

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
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-[var(--border)]" />}
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                step === s ? "bg-[var(--primary)] text-white"
                  : i < stepIdx ? "bg-[var(--positive-dim)] text-[var(--positive)]"
                  : "bg-white/5 text-slate-600"
              )}>
                {i < stepIdx ? <Check size={10} /> : i + 1}
              </div>
              <span className={cn("text-xs font-medium capitalize", step === s ? "text-white" : "text-slate-600")}>
                {s === "upload" ? "Upload" : s === "preview" ? "Review" : "Done"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Upload ── */}
      {step === "upload" && (
        <div className="space-y-4 animate-slide-up delay-100">
          {/* Client selector */}
          <div className="glass p-4">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
              Portfolio Company
            </label>
            {clients.length === 0 ? (
              <p className="text-sm text-slate-500">
                No clients yet.{" "}
                <a href="/clients" className="text-[var(--primary)] hover:underline">Add one first →</a>
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
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            )}
          </div>

          {clients.length > 0 && <DropZone onFile={handleFile} />}

          {parseError && (
            <div className="glass p-4 flex items-start gap-3 border-[var(--negative)]">
              <AlertCircle size={15} className="text-[var(--negative)] shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--negative)]">{parseError}</p>
            </div>
          )}

          {/* Supported banks */}
          <div className="glass-solid p-5 rounded-2xl space-y-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Supported Banks</div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { bank: "TD", note: "EasyWeb CSV — no headers, CREDIT/DEBIT rows" },
                { bank: "RBC", note: "Online Banking — Description 1+2, CAD$ column" },
                { bank: "BMO", note: "Online Banking — 'Jan. 15, 2025' date format" },
                { bank: "Scotiabank", note: "Withdrawals / Deposits columns" },
                { bank: "CIBC", note: "Debit / Credit columns" },
                { bank: "Desjardins", note: "French headers — Débit / Crédit" },
              ].map(({ bank, note }) => (
                <div key={bank} className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.025]">
                  <span
                    className="w-2 h-2 rounded-full mt-1 shrink-0"
                    style={{ background: BANK_BADGES[bank] ?? "#475569" }}
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">{bank}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{note}</div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600">
              Also works with National Bank, Tangerine, Simplii, EQ Bank, and any CSV with Date + Description + Amount columns.
            </p>
          </div>
        </div>
      )}

      {/* ── Preview ── */}
      {step === "preview" && (
        <div className="space-y-4 animate-slide-up">
          {/* Summary */}
          <div className="glass p-4 flex items-center gap-6 flex-wrap">
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
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              {detectedBank && <BankBadge bank={detectedBank} />}
              <span className="text-xs text-slate-500">
                → <strong className="text-white">{selected?.name}</strong>
              </span>
            </div>
          </div>

          {parseError && (
            <div className="glass p-4 flex items-start gap-3">
              <AlertCircle size={15} className="text-[var(--negative)] shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--negative)]">{parseError}</p>
            </div>
          )}

          {/* Table */}
          <div className="glass overflow-hidden">
            <div className="overflow-x-auto" style={{ maxHeight: "480px", overflowY: "auto" }}>
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
                        {new Date(row.date).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
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
                          {TRANSACTION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => { setStep("upload"); setRows([]); setBank(undefined); setError("") }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing || !rows.length}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {importing ? "Importing…" : `Import ${rows.length} Transaction${rows.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {step === "done" && (
        <div className="glass flex flex-col items-center justify-center py-20 gap-5 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-[var(--positive-dim)] flex items-center justify-center">
            <Check size={28} className="text-[var(--positive)]" />
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white mb-1">Import Complete</div>
            <div className="text-slate-400 text-sm">
              Imported <strong className="text-white">{importedCount}</strong> transactions
              into <strong className="text-white">{selected?.name}</strong>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setStep("upload"); setRows([]); setBank(undefined); setCount(0) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 border border-[var(--border)] transition-colors"
            >
              <Upload size={14} /> Import Another
            </button>
            <a
              href="/transactions"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <FileText size={14} /> View Transactions
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
