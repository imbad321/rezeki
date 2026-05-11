import * as XLSX from "xlsx"
import { formatCurrency } from "./utils"

interface Transaction {
  date: string | Date
  description: string
  category: string
  type: string
  amount: number
}

interface PlPoint {
  month: string | Date
  income: number
  expenses: number
  profit: number
  margin: number
}

interface DashboardExportData {
  kpis: {
    mrr: number; arr: number; burnRate: number; runway: number
    cashOnHand: number; headcount: number; mrrGrowthPct: number
    grossProfit: number; grossMargin: number
    monthlyRevenue: number; monthlyExpenses: number
    revenueGrowthPct: number; expenseGrowthPct: number
  }
  plSeries: PlPoint[]
  incomeByCategory: Record<string, number>
  expenseByCategory: Record<string, number>
}

interface TransactionsExportData {
  transactions: Transaction[]
}

function headerStyle(): XLSX.CellStyle {
  return {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
    fill: { fgColor: { rgb: "0D1117" } },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      bottom: { style: "medium", color: { rgb: "6366F1" } },
    },
  }
}

function numStyle(format = "#,##0.00"): XLSX.CellStyle {
  return { numFmt: format, alignment: { horizontal: "right" } }
}

function pctStyle(): XLSX.CellStyle {
  return { numFmt: "0.0%", alignment: { horizontal: "right" } }
}

function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws["!cols"] = widths.map((w) => ({ wch: w }))
}

function addHeaderRow(ws: XLSX.WorkSheet, headers: string[], rowIdx: number) {
  headers.forEach((h, c) => {
    const ref = XLSX.utils.encode_cell({ r: rowIdx, c })
    ws[ref] = { v: h, t: "s", s: headerStyle() }
  })
}

function sheetRange(ws: XLSX.WorkSheet, rows: number, cols: number) {
  ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: rows, c: cols - 1 })
}

// ── Sheet 1: Executive Summary ───────────────────────────────────────────────
function buildExecutiveSummary(data: DashboardExportData, clientName: string): XLSX.WorkSheet {
  const { kpis } = data
  const ws: XLSX.WorkSheet = {}

  const rows = [
    ["MERIDIAN CFO PLATFORM", "", ""],
    [`Executive Summary — ${clientName}`, "", ""],
    [`Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, "", ""],
    ["", "", ""],
    ["KEY METRICS", "VALUE", ""],
    ["MRR", kpis.mrr, ""],
    ["ARR", kpis.arr, ""],
    ["Monthly Revenue", kpis.monthlyRevenue, ""],
    ["Monthly Expenses", kpis.monthlyExpenses, ""],
    ["Net Profit (Monthly)", kpis.grossProfit, ""],
    ["Gross Margin", kpis.grossMargin / 100, ""],
    ["", "", ""],
    ["CASH & RUNWAY", "VALUE", ""],
    ["Cash on Hand", kpis.cashOnHand, ""],
    ["Monthly Burn Rate", kpis.burnRate, ""],
    ["Runway (months)", kpis.runway, ""],
    ["Headcount", kpis.headcount, ""],
    ["", "", ""],
    ["GROWTH RATES", "VALUE", ""],
    ["MRR Growth (MoM)", kpis.mrrGrowthPct / 100, ""],
    ["Revenue Growth (MoM)", kpis.revenueGrowthPct / 100, ""],
    ["Expense Growth (MoM)", kpis.expenseGrowthPct / 100, ""],
  ]

  XLSX.utils.sheet_add_aoa(ws, rows, { origin: "A1" })

  // Style title
  ws["A1"] = { v: "MERIDIAN CFO PLATFORM", t: "s", s: { font: { bold: true, sz: 14, color: { rgb: "6366F1" } } } }
  ws["A2"] = { v: `Executive Summary — ${clientName}`, t: "s", s: { font: { bold: true, sz: 12, color: { rgb: "F0F4FF" } } } }

  // Format currency cells
  const currencyRows = [5,6,7,8,9,13,14]
  const baseRow = 1 // 0-indexed
  currencyRows.forEach((r) => {
    const ref = XLSX.utils.encode_cell({ r: r, c: 1 })
    if (ws[ref]) ws[ref].s = numStyle('"$"#,##0')
  })
  // Percentage cells
  ;[10,19,20,21].forEach((r) => {
    const ref = XLSX.utils.encode_cell({ r: r, c: 1 })
    if (ws[ref]) ws[ref].s = pctStyle()
  })

  setColWidths(ws, [28, 18, 12])
  sheetRange(ws, rows.length - 1, 3)
  return ws
}

// ── Sheet 2: Income Tracking ─────────────────────────────────────────────────
function buildIncomeTracking(data: DashboardExportData): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {}
  const { plSeries, incomeByCategory } = data

  // Monthly income table
  const headers = ["Month", "Total Revenue", "vs Prior Month", "Growth %"]
  addHeaderRow(ws, headers, 0)

  plSeries.forEach((p, i) => {
    const prev = plSeries[i - 1]?.income ?? p.income
    const growth = prev > 0 ? (p.income - prev) / prev : 0
    const r = i + 1
    const row: [string, number, number, number] = [
      new Date(p.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      p.income,
      p.income - prev,
      growth,
    ]
    XLSX.utils.sheet_add_aoa(ws, [row], { origin: { r, c: 0 } })
    ;[1, 2].forEach((c) => {
      const ref = XLSX.utils.encode_cell({ r, c })
      if (ws[ref]) ws[ref].s = numStyle('"$"#,##0')
    })
    const pRef = XLSX.utils.encode_cell({ r, c: 3 })
    if (ws[pRef]) ws[pRef].s = pctStyle()
  })

  // Category breakdown below
  const catStart = plSeries.length + 3
  XLSX.utils.sheet_add_aoa(ws, [["REVENUE BY CATEGORY (latest month)"]], { origin: { r: catStart, c: 0 } })
  XLSX.utils.sheet_add_aoa(ws, [["Category", "Amount", "Share %"]], { origin: { r: catStart + 1, c: 0 } })
  addHeaderRow(ws, ["Category", "Amount", "Share %"], catStart + 1)
  const total = Object.values(incomeByCategory).reduce((s, v) => s + v, 0)
  Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, val], i) => {
    const r = catStart + 2 + i
    XLSX.utils.sheet_add_aoa(ws, [[cat, val, val / total]], { origin: { r, c: 0 } })
    const amtRef = XLSX.utils.encode_cell({ r, c: 1 })
    if (ws[amtRef]) ws[amtRef].s = numStyle('"$"#,##0')
    const pctRef = XLSX.utils.encode_cell({ r, c: 2 })
    if (ws[pctRef]) ws[pctRef].s = pctStyle()
  })

  setColWidths(ws, [20, 18, 16, 14])
  ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: catStart + 2 + Object.keys(incomeByCategory).length, c: 3 })
  return ws
}

// ── Sheet 3: Expense Tracking ────────────────────────────────────────────────
function buildExpenseTracking(data: DashboardExportData): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {}
  const { plSeries, expenseByCategory } = data

  addHeaderRow(ws, ["Month", "Total Expenses", "vs Prior Month", "Growth %"], 0)

  plSeries.forEach((p, i) => {
    const prev = plSeries[i - 1]?.expenses ?? p.expenses
    const growth = prev > 0 ? (p.expenses - prev) / prev : 0
    const r = i + 1
    XLSX.utils.sheet_add_aoa(ws, [[
      new Date(p.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      p.expenses, p.expenses - prev, growth,
    ]], { origin: { r, c: 0 } })
    ;[1, 2].forEach((c) => { const ref = XLSX.utils.encode_cell({ r, c }); if (ws[ref]) ws[ref].s = numStyle('"$"#,##0') })
    const pRef = XLSX.utils.encode_cell({ r, c: 3 }); if (ws[pRef]) ws[pRef].s = pctStyle()
  })

  const catStart = plSeries.length + 3
  addHeaderRow(ws, ["Category", "Amount", "Share %"], catStart)
  const total = Object.values(expenseByCategory).reduce((s, v) => s + v, 0)
  Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, val], i) => {
    const r = catStart + 1 + i
    XLSX.utils.sheet_add_aoa(ws, [[cat, val, val / total]], { origin: { r, c: 0 } })
    const amtRef = XLSX.utils.encode_cell({ r, c: 1 }); if (ws[amtRef]) ws[amtRef].s = numStyle('"$"#,##0')
    const pctRef = XLSX.utils.encode_cell({ r, c: 2 }); if (ws[pctRef]) ws[pctRef].s = pctStyle()
  })

  setColWidths(ws, [20, 18, 16, 14])
  ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: catStart + 1 + Object.keys(expenseByCategory).length, c: 3 })
  return ws
}

// ── Sheet 4: Financial Metrics ───────────────────────────────────────────────
function buildFinancialMetrics(data: DashboardExportData): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {}
  const { plSeries } = data

  addHeaderRow(ws, ["Month", "Revenue", "Expenses", "Gross Profit", "Margin %", "Burn Rate"], 0)

  plSeries.forEach((p, i) => {
    const r = i + 1
    XLSX.utils.sheet_add_aoa(ws, [[
      new Date(p.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      p.income, p.expenses, p.profit, p.margin / 100, data.kpis.burnRate,
    ]], { origin: { r, c: 0 } })
    ;[1, 2, 3, 5].forEach((c) => { const ref = XLSX.utils.encode_cell({ r, c }); if (ws[ref]) ws[ref].s = numStyle('"$"#,##0') })
    const mRef = XLSX.utils.encode_cell({ r, c: 4 }); if (ws[mRef]) ws[mRef].s = pctStyle()
  })

  setColWidths(ws, [18, 16, 16, 16, 12, 16])
  sheetRange(ws, plSeries.length, 6)
  return ws
}

// ── Sheet 5: Raw Transactions ────────────────────────────────────────────────
function buildRawTransactions(txs: Transaction[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {}
  addHeaderRow(ws, ["Date", "Description", "Category", "Type", "Amount"], 0)

  txs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach((tx, i) => {
      const r = i + 1
      XLSX.utils.sheet_add_aoa(ws, [[
        new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        tx.description, tx.category, tx.type,
        tx.type === "EXPENSE" ? -tx.amount : tx.amount,
      ]], { origin: { r, c: 0 } })
      const amtRef = XLSX.utils.encode_cell({ r, c: 4 })
      if (ws[amtRef]) ws[amtRef].s = numStyle('"$"#,##0.00')
    })

  setColWidths(ws, [18, 32, 22, 10, 16])
  sheetRange(ws, txs.length, 5)
  return ws
}

// ── Public entry points ──────────────────────────────────────────────────────
export function exportDashboardToExcel(data: DashboardExportData, clientName: string) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, buildExecutiveSummary(data, clientName), "Executive Summary")
  XLSX.utils.book_append_sheet(wb, buildIncomeTracking(data),  "Income Tracking")
  XLSX.utils.book_append_sheet(wb, buildExpenseTracking(data), "Expense Tracking")
  XLSX.utils.book_append_sheet(wb, buildFinancialMetrics(data), "Financial Metrics")

  const slug = clientName.replace(/\s+/g, "_")
  const date = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `Meridian_${slug}_${date}.xlsx`)
}

export function exportTransactionsToExcel(data: TransactionsExportData & DashboardExportData, clientName: string) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, buildExecutiveSummary(data, clientName), "Executive Summary")
  XLSX.utils.book_append_sheet(wb, buildIncomeTracking(data),  "Income Tracking")
  XLSX.utils.book_append_sheet(wb, buildExpenseTracking(data), "Expense Tracking")
  XLSX.utils.book_append_sheet(wb, buildFinancialMetrics(data), "Financial Metrics")
  XLSX.utils.book_append_sheet(wb, buildRawTransactions(data.transactions), "Raw Transactions")

  const slug = clientName.replace(/\s+/g, "_")
  const date = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `Meridian_${slug}_Transactions_${date}.xlsx`)
}
