import ExcelJS from "exceljs"
import { db } from "@/lib/prisma"

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  headerBg:     "FF0D1117",
  headerFg:     "FFF0F4FF",
  accentIndigo: "FF6366F1",
  accentGold:   "FFD4AF37",
  positive:     "FF0D7A55",
  positiveBg:   "FFE6F7F1",
  negative:     "FF9B1C1C",
  negativeBg:   "FFFEF2F2",
  rowAlt:       "FFF8FAFC",
  rowBase:      "FFFFFFFF",
  sectionBg:    "FF1E293B",
  sectionFg:    "FFF0F4FF",
  border:       "FFE2E8F0",
  borderStrong: "FF94A3B8",
  text:         "FF1E293B",
  muted:        "FF64748B",
  totalBg:      "FFF1F5F9",
}

function applyHeaderRow(row: ExcelJS.Row, cols: number) {
  row.height = 32
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    if (colNum > cols) return
    cell.font = { bold: true, size: 10, color: { argb: C.headerFg }, name: "Calibri" }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } }
    cell.alignment = { vertical: "middle", horizontal: colNum === 1 ? "left" : "right", wrapText: false }
    cell.border = {
      bottom: { style: "medium", color: { argb: C.accentIndigo } },
      top:    { style: "thin",   color: { argb: C.headerBg } },
    }
  })
  // first cell always left-aligned
  const first = row.getCell(1)
  first.alignment = { vertical: "middle", horizontal: "left" }
}

function applyDataRow(row: ExcelJS.Row, rowIdx: number, cols: number) {
  const bg = rowIdx % 2 === 0 ? C.rowAlt : C.rowBase
  row.height = 20
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    if (colNum > cols) return
    cell.font = { size: 10, color: { argb: C.text }, name: "Calibri" }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } }
    cell.alignment = { vertical: "middle", horizontal: colNum === 1 ? "left" : "right" }
    cell.border = { bottom: { style: "hair", color: { argb: C.border } } }
  })
}

function applyTotalRow(row: ExcelJS.Row, cols: number) {
  row.height = 24
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    if (colNum > cols) return
    cell.font = { bold: true, size: 10, color: { argb: C.text }, name: "Calibri" }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.totalBg } }
    cell.alignment = { vertical: "middle", horizontal: colNum === 1 ? "left" : "right" }
    cell.border = {
      top:    { style: "medium", color: { argb: C.borderStrong } },
      bottom: { style: "medium", color: { argb: C.borderStrong } },
    }
  })
}

function applySectionHeader(row: ExcelJS.Row, cols: number) {
  row.height = 26
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    if (colNum > cols) return
    cell.font = { bold: true, size: 10, color: { argb: C.sectionFg }, name: "Calibri" }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.sectionBg } }
    cell.alignment = { vertical: "middle", horizontal: "left" }
  })
}

function applyTitleBlock(ws: ExcelJS.Worksheet, title: string, subtitle: string, clientName: string) {
  // Row 1: main title
  ws.mergeCells("A1:F1")
  const t = ws.getCell("A1")
  t.value = "MERIDIAN CFO PLATFORM"
  t.font = { bold: true, size: 16, color: { argb: C.accentIndigo }, name: "Calibri" }
  t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } }
  t.alignment = { vertical: "middle", horizontal: "left" }
  ws.getRow(1).height = 36

  // Row 2: subtitle + client
  ws.mergeCells("A2:F2")
  const s = ws.getCell("A2")
  s.value = `${title} — ${clientName}`
  s.font = { bold: true, size: 12, color: { argb: C.headerFg }, name: "Calibri" }
  s.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } }
  s.alignment = { vertical: "middle", horizontal: "left" }
  ws.getRow(2).height = 28

  // Row 3: date + sheet description
  ws.mergeCells("A3:F3")
  const d = ws.getCell("A3")
  d.value = `${subtitle}  ·  Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
  d.font = { size: 9, italic: true, color: { argb: C.muted }, name: "Calibri" }
  d.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } }
  d.alignment = { vertical: "middle", horizontal: "left" }
  ws.getRow(3).height = 20

  // Row 4: spacer
  ws.mergeCells("A4:F4")
  ws.getCell("A4").fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } }
  ws.getRow(4).height = 8
}

function usd(v: number): Partial<ExcelJS.Cell> {
  return { numFmt: '"$"#,##0', value: v }
}
function pct(v: number): Partial<ExcelJS.Cell> {
  return { numFmt: "0.0%", value: v }
}
function num(v: number): Partial<ExcelJS.Cell> {
  return { numFmt: "#,##0", value: v }
}
function usd2(v: number): Partial<ExcelJS.Cell> {
  return { numFmt: '"$"#,##0.00', value: v }
}

// ── Sheet 1: Executive Summary ───────────────────────────────────────────────
async function buildExecutiveSummary(wb: ExcelJS.Workbook, kpis: any, clientName: string) {
  const ws = wb.addWorksheet("Executive Summary", { tabColor: { argb: C.accentIndigo } })
  ws.columns = [
    { key: "label", width: 30 },
    { key: "value", width: 20 },
    { key: "spacer", width: 4 },
    { key: "label2", width: 30 },
    { key: "value2", width: 20 },
  ]

  applyTitleBlock(ws, "Executive Summary", "Key financial metrics snapshot", clientName)

  // ── LEFT column: Revenue & Profit metrics ──
  const leftMetrics = [
    ["KEY METRICS", null],
    ["Monthly Recurring Revenue (MRR)", kpis.mrr],
    ["Annual Recurring Revenue (ARR)",  kpis.arr],
    ["Monthly Revenue",                 kpis.monthlyRevenue],
    ["Monthly Expenses",                kpis.monthlyExpenses],
    ["Net Profit (Monthly)",            kpis.grossProfit],
    ["Gross Margin",                    kpis.grossMargin / 100],
    [null, null],
    ["GROWTH RATES", null],
    ["MRR Growth (MoM)",                kpis.mrrGrowthPct / 100],
    ["Revenue Growth (MoM)",            kpis.revenueGrowthPct / 100],
    ["Expense Growth (MoM)",            kpis.expenseGrowthPct / 100],
  ]

  // ── RIGHT column: Cash & Operations ──
  const rightMetrics = [
    ["CASH & RUNWAY", null],
    ["Cash on Hand",                    kpis.cashOnHand],
    ["Monthly Burn Rate",               kpis.burnRate],
    ["Runway (months)",                 Math.floor(kpis.runway)],
    ["Headcount",                       kpis.headcount],
    [null, null],
    ["HEALTH INDICATORS", null],
    ["Burn Multiple",                   kpis.burnRate > 0 ? kpis.monthlyRevenue / kpis.burnRate : 0],
    ["Revenue / Burn Ratio",            kpis.burnRate > 0 ? kpis.monthlyRevenue / kpis.burnRate : 0],
  ]

  const startRow = 6
  const maxLen = Math.max(leftMetrics.length, rightMetrics.length)

  for (let i = 0; i < maxLen; i++) {
    const r = ws.getRow(startRow + i)
    const [ll, lv] = leftMetrics[i] ?? [null, null]
    const [rl, rv] = rightMetrics[i] ?? [null, null]

    if (ll === null && lv === null && rl === null && rv === null) {
      r.height = 8; continue
    }

    // Section headers
    if (lv === null && typeof ll === "string") {
      const c = r.getCell("A")
      c.value = ll
      c.font = { bold: true, size: 9, color: { argb: C.headerFg }, name: "Calibri" }
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.sectionBg } }
      c.alignment = { vertical: "middle" }
      r.height = 22
      ws.mergeCells(`A${startRow + i}:B${startRow + i}`)
    } else if (ll !== null) {
      applyDataRow(r, i, 2)
      r.getCell("A").value = ll
      const vc = r.getCell("B")
      if (typeof lv === "number") {
        if (i >= 9) { vc.numFmt = "0.0%"; vc.value = lv }
        else if (i === 7) { vc.numFmt = "0.0%"; vc.value = lv }
        else if (i <= 6) { vc.numFmt = '"$"#,##0'; vc.value = lv }
        else { vc.value = lv }
        // Color net profit
        if (ll === "Net Profit (Monthly)") {
          vc.font = { bold: true, size: 10, color: { argb: (lv as number) >= 0 ? C.positive : C.negative }, name: "Calibri" }
        }
      }
    }

    // Right column
    if (rv === null && typeof rl === "string") {
      const c = r.getCell("D")
      c.value = rl
      c.font = { bold: true, size: 9, color: { argb: C.headerFg }, name: "Calibri" }
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C.sectionBg } }
      c.alignment = { vertical: "middle" }
      r.height = 22
      ws.mergeCells(`D${startRow + i}:E${startRow + i}`)
    } else if (rl !== null) {
      const dc = r.getCell("D")
      const ec = r.getCell("E")
      dc.value = rl
      dc.font = { size: 10, color: { argb: C.text }, name: "Calibri" }
      dc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? C.rowAlt : C.rowBase } }
      ec.font = { size: 10, color: { argb: C.text }, name: "Calibri" }
      ec.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? C.rowAlt : C.rowBase } }
      ec.alignment = { horizontal: "right", vertical: "middle" }
      if (typeof rv === "number") {
        if (rl?.includes("Cash") || rl?.includes("Burn")) { ec.numFmt = '"$"#,##0'; ec.value = rv }
        else if (rl?.includes("Ratio") || rl?.includes("Multiple")) { ec.numFmt = "0.00x"; ec.value = rv }
        else { ec.value = rv }
      }
    }
  }

  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }]
}

// ── Sheet 2 & 3: Income / Expense Tracking ───────────────────────────────────
async function buildTrackingSheet(
  wb: ExcelJS.Workbook,
  name: string,
  tabColor: string,
  plSeries: any[],
  categoryMap: Record<string, number>,
  clientName: string,
  field: "income" | "expenses"
) {
  const ws = wb.addWorksheet(name, { tabColor: { argb: tabColor } })
  const isIncome = field === "income"
  const headerLabel = isIncome ? "Total Revenue" : "Total Expenses"
  const accentColor = isIncome ? C.accentIndigo : "FFEF4444"

  ws.columns = [
    { key: "month",  width: 16 },
    { key: "total",  width: 18 },
    { key: "delta",  width: 18 },
    { key: "growth", width: 14 },
    { key: "pct",    width: 14 },
  ]

  applyTitleBlock(ws, name, isIncome ? "Monthly revenue trends and breakdown" : "Monthly expense trends and breakdown", clientName)

  // Table header row 5
  const hdr = ws.getRow(5)
  hdr.values = ["Month", headerLabel, "vs Prior Month", "Growth %", "% of Total"]
  applyHeaderRow(hdr, 5)
  // Override accent border color per sheet
  hdr.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = { bottom: { style: "medium", color: { argb: accentColor } } }
  })

  const total18 = plSeries.reduce((s, p) => s + p[field], 0)
  let rowIdx = 0
  for (const p of plSeries) {
    const prev  = plSeries[rowIdx === 0 ? 0 : rowIdx - 1][field]
    const delta = rowIdx === 0 ? 0 : p[field] - prev
    const growth = prev > 0 && rowIdx > 0 ? (p[field] - prev) / prev : 0
    const pctOfTotal = total18 > 0 ? p[field] / total18 : 0

    const r = ws.getRow(6 + rowIdx)
    r.values = [
      new Date(p.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      p[field], delta, growth, pctOfTotal,
    ]
    r.getCell(2).numFmt = '"$"#,##0'
    r.getCell(3).numFmt = '"$"#,##0;[Red]"-$"#,##0'
    r.getCell(4).numFmt = '0.0%;[Red]-0.0%'
    r.getCell(5).numFmt = '0.0%'
    applyDataRow(r, rowIdx, 5)

    // Color the delta cell
    const dCell = r.getCell(3)
    dCell.font = { size: 10, color: { argb: delta >= 0 ? C.positive : C.negative }, name: "Calibri" }

    rowIdx++
  }

  // Totals row
  const totR = ws.getRow(6 + rowIdx)
  const totalVal = plSeries.reduce((s, p) => s + p[field], 0)
  totR.values = ["TOTAL (18 months)", totalVal, "", "", 1.0]
  totR.getCell(2).numFmt = '"$"#,##0'
  totR.getCell(5).numFmt = '0.0%'
  applyTotalRow(totR, 5)

  // Freeze header + title
  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }]
  ws.autoFilter = { from: "A5", to: "E5" }

  // ── Category breakdown ───────────────────────────────────────────────────
  const catStartRow = 6 + rowIdx + 3
  const catHdr = ws.getRow(catStartRow)
  catHdr.values = ["CATEGORY BREAKDOWN", "", "", "", ""]
  applySectionHeader(catHdr, 5)
  ws.mergeCells(`A${catStartRow}:E${catStartRow}`)

  const catColHdr = ws.getRow(catStartRow + 1)
  catColHdr.values = ["Category", "Amount", "", "Share %", ""]
  applyHeaderRow(catColHdr, 4)

  const catTotal = Object.values(categoryMap).reduce((s, v) => s + v, 0)
  Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, val], ci) => {
      const r = ws.getRow(catStartRow + 2 + ci)
      r.values = [cat, val, "", catTotal > 0 ? val / catTotal : 0, ""]
      r.getCell(2).numFmt = '"$"#,##0'
      r.getCell(4).numFmt = '0.0%'
      applyDataRow(r, ci, 4)
      // Bar-style share indicator using padding hack in label
      const shareCell = r.getCell(4)
      shareCell.font = {
        size: 10,
        color: { argb: isIncome ? C.accentIndigo : "FFEF4444" },
        name: "Calibri",
      }
    })
}

// ── Sheet 4: Financial Metrics ───────────────────────────────────────────────
async function buildMetricsSheet(wb: ExcelJS.Workbook, plSeries: any[], kpis: any, clientName: string) {
  const ws = wb.addWorksheet("Financial Metrics", { tabColor: { argb: C.accentGold } })

  ws.columns = [
    { key: "month",   width: 16 },
    { key: "revenue", width: 18 },
    { key: "expense", width: 18 },
    { key: "profit",  width: 18 },
    { key: "margin",  width: 14 },
    { key: "burn",    width: 18 },
    { key: "cash_ratio", width: 16 },
  ]

  applyTitleBlock(ws, "Financial Metrics", "Monthly P&L breakdown with margin and burn analysis", clientName)

  const hdr = ws.getRow(5)
  hdr.values = ["Month", "Revenue", "Expenses", "Net Profit", "Margin %", "Burn Rate", "Rev/Burn"]
  applyHeaderRow(hdr, 7)

  plSeries.forEach((p, i) => {
    const r = ws.getRow(6 + i)
    const revBurn = kpis.burnRate > 0 ? p.income / kpis.burnRate : 0
    r.values = [
      new Date(p.month).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      p.income, p.expenses, p.profit, p.margin / 100, kpis.burnRate, revBurn,
    ]
    r.getCell(2).numFmt = '"$"#,##0'
    r.getCell(3).numFmt = '"$"#,##0'
    r.getCell(4).numFmt = '"$"#,##0'
    r.getCell(5).numFmt = '0.0%'
    r.getCell(6).numFmt = '"$"#,##0'
    r.getCell(7).numFmt = '0.00x'
    applyDataRow(r, i, 7)

    // Color profit cell
    const profitCell = r.getCell(4)
    profitCell.font = {
      size: 10, name: "Calibri",
      bold: true,
      color: { argb: p.profit >= 0 ? C.positive : C.negative },
    }
    profitCell.fill = {
      type: "pattern", pattern: "solid",
      fgColor: { argb: p.profit >= 0 ? C.positiveBg : C.negativeBg },
    }

    // Color margin
    const marginCell = r.getCell(5)
    marginCell.font = { size: 10, name: "Calibri", color: { argb: p.margin >= 0 ? C.positive : C.negative } }
  })

  // Summary totals
  const totRow = ws.getRow(6 + plSeries.length)
  const totRev = plSeries.reduce((s, p) => s + p.income,   0)
  const totExp = plSeries.reduce((s, p) => s + p.expenses, 0)
  const totPro = totRev - totExp
  totRow.values = ["TOTAL / AVG", totRev, totExp, totPro, totPro / totRev, kpis.burnRate, totRev / kpis.burnRate]
  totRow.getCell(2).numFmt = '"$"#,##0'
  totRow.getCell(3).numFmt = '"$"#,##0'
  totRow.getCell(4).numFmt = '"$"#,##0'
  totRow.getCell(5).numFmt = '0.0%'
  totRow.getCell(6).numFmt = '"$"#,##0'
  totRow.getCell(7).numFmt = '0.00x'
  applyTotalRow(totRow, 7)

  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }]
  ws.autoFilter = { from: "A5", to: "G5" }
}

// ── Sheet 5: Raw Transactions ────────────────────────────────────────────────
async function buildTransactionsSheet(wb: ExcelJS.Workbook, transactions: any[], clientName: string) {
  const ws = wb.addWorksheet("Raw Transactions", { tabColor: { argb: "FF22D3A5" } })

  ws.columns = [
    { key: "date",   width: 18 },
    { key: "desc",   width: 36 },
    { key: "cat",    width: 24 },
    { key: "type",   width: 12 },
    { key: "amount", width: 18 },
  ]

  applyTitleBlock(ws, "Raw Transactions", "Complete transaction ledger sorted by date descending", clientName)

  const hdr = ws.getRow(5)
  hdr.values = ["Date", "Description", "Category", "Type", "Amount"]
  applyHeaderRow(hdr, 5)

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  sorted.forEach((tx, i) => {
    const isIncome = tx.type === "INCOME"
    const r = ws.getRow(6 + i)
    r.values = [
      new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      tx.description,
      tx.category,
      isIncome ? "Income" : "Expense",
      isIncome ? tx.amount : -tx.amount,
    ]
    r.getCell(5).numFmt = '"$"#,##0.00;[Red]"-$"#,##0.00'
    applyDataRow(r, i, 5)

    // Tint income/expense rows
    const tint = isIncome ? C.positiveBg : C.negativeBg
    const amtCell = r.getCell(5)
    amtCell.font = {
      bold: true, size: 10, name: "Calibri",
      color: { argb: isIncome ? C.positive : C.negative },
    }

    // Type cell badge-style
    const typeCell = r.getCell(4)
    typeCell.font = {
      bold: true, size: 9, name: "Calibri",
      color: { argb: isIncome ? C.positive : C.negative },
    }
  })

  // Summary rows at bottom
  const totalInc = transactions.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0)
  const totalExp = transactions.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0)
  const net = totalInc - totalExp

  const gap = ws.getRow(6 + sorted.length + 1)
  gap.height = 8

  const sumHdr = ws.getRow(6 + sorted.length + 2)
  sumHdr.values = ["SUMMARY", "", "", "", ""]
  applySectionHeader(sumHdr, 5)
  ws.mergeCells(`A${6 + sorted.length + 2}:E${6 + sorted.length + 2}`)

  const rows = [["Total Income", "", "", "Income", totalInc],
                ["Total Expenses", "", "", "Expense", -totalExp],
                ["Net Position", "", "", "", net]]
  rows.forEach(([label, , , type, val], i) => {
    const r = ws.getRow(6 + sorted.length + 3 + i)
    r.values = [label, "", "", type, val]
    r.getCell(5).numFmt = '"$"#,##0.00'
    applyTotalRow(r, 5)
    const vc = r.getCell(5)
    vc.font = { bold: true, size: 10, name: "Calibri", color: { argb: (val as number) >= 0 ? C.positive : C.negative } }
  })

  ws.views = [{ state: "frozen", xSplit: 0, ySplit: 5 }]
  ws.autoFilter = { from: "A5", to: "E5" }
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get("clientId") ?? ""
    if (!clientId) return new Response("clientId required", { status: 400 })

    const client = await db.client.findUnique({ where: { id: clientId } })
    if (!client) return new Response("Client not found", { status: 404 })

    const [mrrPoints, snapshot, transactions] = await Promise.all([
      db.mrrDataPoint.findMany({ where: { clientId }, orderBy: { month: "asc" } }),
      db.companySnapshot.findFirst({ where: { clientId }, orderBy: { snapshotDate: "desc" } }),
      db.transaction.findMany({ where: { clientId }, orderBy: { date: "asc" } }),
    ])

    // Build P&L series
    const monthMap = new Map<string, any>()
    for (const tx of transactions) {
      const key = tx.date.toISOString().slice(0, 7)
      if (!monthMap.has(key)) monthMap.set(key, { month: tx.date, income: 0, expenses: 0, profit: 0, margin: 0 })
      const m = monthMap.get(key)!
      if (tx.type === "INCOME")  m.income   += tx.amount
      if (tx.type === "EXPENSE") m.expenses += tx.amount
    }
    const plSeries = Array.from(monthMap.values())
      .sort((a, b) => a.month.getTime() - b.month.getTime())
      .map(m => { m.profit = m.income - m.expenses; m.margin = m.income > 0 ? (m.profit / m.income) * 100 : 0; return m })

    const latestPL   = plSeries.at(-1)  ?? { income: 0, expenses: 0, profit: 0, margin: 0 }
    const prevPL     = plSeries.at(-2)  ?? latestPL
    const latestMrr  = mrrPoints.at(-1)?.mrr ?? 0
    const prevMrr    = mrrPoints.at(-2)?.mrr ?? latestMrr
    const cash       = snapshot?.cashOnHand ?? 0
    const burn       = snapshot?.burnRate   ?? 1

    const kpis = {
      mrr: latestMrr,
      arr: snapshot?.arr ?? latestMrr * 12,
      burnRate: burn,
      runway: burn > 0 ? cash / burn : 0,
      cashOnHand: cash,
      headcount: snapshot?.headcount ?? 0,
      mrrGrowthPct:       prevMrr > 0    ? ((latestMrr - prevMrr) / prevMrr) * 100 : 0,
      grossProfit:        latestPL.profit,
      grossMargin:        latestPL.margin,
      monthlyRevenue:     latestPL.income,
      monthlyExpenses:    latestPL.expenses,
      revenueGrowthPct:   prevPL.income   > 0 ? ((latestPL.income   - prevPL.income)   / prevPL.income)   * 100 : 0,
      expenseGrowthPct:   prevPL.expenses > 0 ? ((latestPL.expenses - prevPL.expenses) / prevPL.expenses) * 100 : 0,
    }

    const incomeByCategory:  Record<string, number> = {}
    const expenseByCategory: Record<string, number> = {}
    for (const tx of transactions.filter(t => t.date.toISOString().slice(0, 7) === plSeries.at(-1)?.month.toISOString().slice(0, 7))) {
      if (tx.type === "INCOME")  incomeByCategory[tx.category]  = (incomeByCategory[tx.category]  ?? 0) + tx.amount
      if (tx.type === "EXPENSE") expenseByCategory[tx.category] = (expenseByCategory[tx.category] ?? 0) + tx.amount
    }

    // Build workbook
    const wb = new ExcelJS.Workbook()
    wb.creator  = "Meridian CFO Platform"
    wb.company  = client.name
    wb.created  = new Date()
    wb.modified = new Date()

    await buildExecutiveSummary(wb, kpis, client.name)
    await buildTrackingSheet(wb, "Income Tracking",  C.accentIndigo, plSeries, incomeByCategory,  client.name, "income")
    await buildTrackingSheet(wb, "Expense Tracking", "FFEF4444",     plSeries, expenseByCategory, client.name, "expenses")
    await buildMetricsSheet(wb, plSeries, kpis, client.name)
    await buildTransactionsSheet(wb, transactions, client.name)

    const buffer = await wb.xlsx.writeBuffer()
    const slug   = client.name.replace(/\s+/g, "_")
    const date   = new Date().toISOString().slice(0, 10)

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Meridian_${slug}_${date}.xlsx"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    console.error(e)
    return new Response("Export failed", { status: 500 })
  }
}
