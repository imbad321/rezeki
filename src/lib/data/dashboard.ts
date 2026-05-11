import { db } from "@/lib/prisma"

export async function getDashboardData(clientId: string) {
  const [mrrPoints, snapshot, transactions] = await Promise.all([
    db.mrrDataPoint.findMany({
      where: { clientId },
      orderBy: { month: "asc" },
      take: 18,
    }),
    db.companySnapshot.findFirst({
      where: { clientId },
      orderBy: { snapshotDate: "desc" },
    }),
    db.transaction.findMany({
      where: { clientId },
      orderBy: { date: "asc" },
    }),
  ])

  const latestMrr = mrrPoints.at(-1)?.mrr ?? 0
  const prevMrr   = mrrPoints.at(-2)?.mrr ?? latestMrr
  const mrrGrowthPct = prevMrr > 0 ? ((latestMrr - prevMrr) / prevMrr) * 100 : 0

  const cash    = snapshot?.cashOnHand ?? 0
  const burn    = snapshot?.burnRate   ?? 1
  const runway  = burn > 0 ? cash / burn : 0

  // Build burn/cash series from MRR data
  let runningCash = cash + mrrPoints.length * burn
  const burnSeries = mrrPoints.map((p) => {
    runningCash -= burn
    return { month: p.month, burn, cash: Math.max(0, runningCash) }
  })

  // Group transactions by month for P&L
  type MonthlyPL = { month: Date; income: number; expenses: number; profit: number; margin: number }
  const monthMap = new Map<string, MonthlyPL>()

  for (const tx of transactions) {
    const key = tx.date.toISOString().slice(0, 7)
    if (!monthMap.has(key)) {
      monthMap.set(key, { month: tx.date, income: 0, expenses: 0, profit: 0, margin: 0 })
    }
    const m = monthMap.get(key)!
    if (tx.type === "INCOME")  m.income   += tx.amount
    if (tx.type === "EXPENSE") m.expenses += tx.amount
  }

  const plSeries = Array.from(monthMap.values())
    .sort((a, b) => a.month.getTime() - b.month.getTime())
    .map((m) => {
      m.profit = m.income - m.expenses
      m.margin = m.income > 0 ? (m.profit / m.income) * 100 : 0
      return m
    })

  // Latest month P&L
  const latestPL   = plSeries.at(-1) ?? { income: 0, expenses: 0, profit: 0, margin: 0 }
  const prevPL     = plSeries.at(-2) ?? latestPL

  const revenueGrowthPct  = prevPL.income   > 0 ? ((latestPL.income   - prevPL.income)   / prevPL.income)   * 100 : 0
  const expenseGrowthPct  = prevPL.expenses > 0 ? ((latestPL.expenses - prevPL.expenses) / prevPL.expenses) * 100 : 0

  // Category breakdown (latest month)
  const latestKey = transactions.length ? transactions.at(-1)!.date.toISOString().slice(0, 7) : null
  const latestTxs = latestKey ? transactions.filter((t) => t.date.toISOString().slice(0, 7) === latestKey) : []

  const incomeByCategory: Record<string, number>  = {}
  const expenseByCategory: Record<string, number> = {}
  for (const tx of latestTxs) {
    if (tx.type === "INCOME")  incomeByCategory[tx.category]  = (incomeByCategory[tx.category]  ?? 0) + tx.amount
    if (tx.type === "EXPENSE") expenseByCategory[tx.category] = (expenseByCategory[tx.category] ?? 0) + tx.amount
  }

  return {
    kpis: {
      mrr: latestMrr,
      arr: snapshot?.arr ?? latestMrr * 12,
      burnRate: burn,
      runway,
      cashOnHand: cash,
      headcount: snapshot?.headcount ?? 0,
      mrrGrowthPct,
      grossProfit: latestPL.profit,
      grossMargin: latestPL.margin,
      monthlyRevenue: latestPL.income,
      monthlyExpenses: latestPL.expenses,
      revenueGrowthPct,
      expenseGrowthPct,
    },
    mrrSeries:  mrrPoints,
    burnSeries,
    plSeries,
    incomeByCategory,
    expenseByCategory,
  }
}
